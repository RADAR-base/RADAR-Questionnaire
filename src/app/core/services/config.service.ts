import 'rxjs/add/operator/toPromise'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version'

import {
  ARMTDefBranchProd,
  ARMTDefBranchTest,
  DefaultNumberOfNotificationsToSchedule,
  DefaultProtocolEndPoint,
  DefaultProtocolURI,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI,
  TEST_ARMT_DEF
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { NotificationService } from './notification.service'
import { SchedulingService } from './scheduling.service'
import { StorageService } from './storage.service'
import { FirebaseAnalyticsService } from './firebaseAnalytics.service'

@Injectable()
export class ConfigService {
  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private schedule: SchedulingService,
    private notificationService: NotificationService,
    private appVersion: AppVersion,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {}

  fetchConfigState(force: boolean) {
    return Promise.all([
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.SCHEDULE_VERSION),
      this.storage.get(StorageKeys.APP_VERSION),
      this.appVersion.getVersionNumber()
    ]).then(
      ([configVersion, scheduleVersion, storedAppVersion, appVersion]) => {
        return this.pullProtocol()
          .then(res => {
            if (res) {
              const response: any = JSON.parse(res)
              if (
                configVersion !== response.version ||
                scheduleVersion !== response.version ||
                storedAppVersion !== appVersion ||
                force
              ) {
                this.storage.set(StorageKeys.APP_VERSION, appVersion)
                this.storage.set(StorageKeys.HAS_CLINICAL_TASKS, false)
                const protocolFormated = this.formatPulledProcotol(
                  response.protocols
                )
                const scheduledAssessments = []
                const clinicalAssessments = []
                for (let i = 0; i < protocolFormated.length; i++) {
                  const clinical =
                    protocolFormated[i]['protocol']['clinicalProtocol']
                  if (clinical) {
                    this.storage.set(StorageKeys.HAS_CLINICAL_TASKS, true)
                    clinicalAssessments.push(protocolFormated[i])
                  } else {
                    scheduledAssessments.push(protocolFormated[i])
                  }
                }
                return this.storage
                  .set(StorageKeys.CONFIG_VERSION, response.version)
                  .then(() => {
                    return this.storage
                      .set(
                        StorageKeys.CONFIG_CLINICAL_ASSESSMENTS,
                        clinicalAssessments
                      )
                      .then(() => {
                        console.log('Pulled clinical questionnaire')
                        return this.pullQuestionnaires(
                          StorageKeys.CONFIG_CLINICAL_ASSESSMENTS
                        )
                      })
                  })
                  .then(() => {
                    return this.storage
                      .set(StorageKeys.CONFIG_ASSESSMENTS, scheduledAssessments)
                      .then(() => {
                        console.log('Pulled questionnaire')
                        return this.pullQuestionnaires(
                          StorageKeys.CONFIG_ASSESSMENTS
                        )
                      })
                  })
                  .then(() => this.schedule.generateSchedule(true))
                  .then(() => this.rescheduleNotifications())
                  .then(() => Promise.all([
                      this.storage.get(StorageKeys.PARTICIPANTLOGIN),
                      this.getProjectName(),
                      this.storage.get(StorageKeys.SOURCEID),
                      this.storage.get(StorageKeys.ENROLMENTDATE),
                      this.storage.get(StorageKeys.PARTICIPANTID)
                    ]).then(([subjectId, projectId, sourceId, enrolmentDate, humanReadableId]) =>
                      this.firebaseAnalytics.setUserProperties({
                      subjectId: subjectId,
                      projectId: projectId,
                      sourceId: sourceId,
                      enrolmentDate: enrolmentDate,
                      humanReadableId: humanReadableId
                    })
                    )
                  )
                  .then(() => this.firebaseAnalytics.logEvent("config_update", {
                    config_version: String(configVersion),
                    schedule_version: String(scheduleVersion),
                    app_version: appVersion,
                    date : new Date()
                   }))
              } else {
                console.log(
                  'NO CONFIG UPDATE. Version of protocol.json has not changed.'
                )
                return this.schedule.generateSchedule(false)
              }
            }
          })
          .catch(e => console.log(e))
      }
    )
  }

  rescheduleNotifications() {
    return this.notificationService.cancelNotifications().then(() => {
      // NOTE: Set notification here too so scheduled everytime the schedule changes too.
      return this.notificationService
        .setNextXNotifications(DefaultNumberOfNotificationsToSchedule)
        .then(() => console.log('NOTIFICATIONS scheduled after config change'))
        .then(() => this.firebaseAnalytics.logEvent("notification_rescheduled", { date : new Date() }))
    })
  }

  updateConfigStateOnLanguageChange() {
    return this.pullQuestionnaires(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
      .then(() => this.pullQuestionnaires(StorageKeys.CONFIG_ASSESSMENTS))
      .then(() => this.rescheduleNotifications())
  }

  updateConfigStateOnTimezoneChange() {
    return this.schedule
      .generateSchedule(true)
      .then(() => this.rescheduleNotifications())
  }

  pullProtocol() {
    return this.getProjectName().then(projectName => {
      if (projectName) {
        const URI = DefaultProtocolEndPoint + projectName + DefaultProtocolURI
        return this.http.get(URI, { responseType: 'text' }).toPromise()
      } else {
        console.error(
          'Unknown project name : ' + projectName + '. Cannot pull protocols.'
        )
      }
    })
  }

  getProjectName() {
    return this.storage.get(StorageKeys.PROJECTNAME)
  }

  formatPulledProcotol(protocols) {
    const protocolsFormated = protocols
    for (let i = 0; i < protocolsFormated.length; i++) {
      protocolsFormated[i].questionnaire['type'] = DefaultQuestionnaireTypeURI
      protocolsFormated[i].questionnaire[
        'format'
      ] = DefaultQuestionnaireFormatURI
    }
    return protocolsFormated
  }

  retrieveLanguageKeys(questionnaireURI) {
    const langs = []
    for (const key in questionnaireURI) {
      if (key) {
        langs.push(key)
      }
    }
    const langsKeyValEmpty = {}
    for (const val of langs) {
      langsKeyValEmpty[val] = ''
    }
    return langsKeyValEmpty
  }

  pullQuestionnaires(storageKey) {
    const assessments = this.storage.get(storageKey)
    const lang = this.storage.get(StorageKeys.LANGUAGE)
    return Promise.all([assessments, lang]).then(vars => {
      const assessmentsResult = vars[0]
      const langResult = vars[1]

      const promises = []
      for (let i = 0; i < assessmentsResult.length; i++) {
        promises.push(
          this.pullQuestionnaireLang(assessmentsResult[i], langResult)
        )
      }
      return Promise.all(promises).then(res => {
        const assessmentUpdate = assessmentsResult
        for (let i = 0; i < assessmentsResult.length; i++) {
          assessmentUpdate[i]['questions'] = this.formatQuestionsHeaders(res[i])
        }
        return this.storage.set(storageKey, assessmentUpdate)
      })
    })
  }

  pullQuestionnaireLang(assessment, lang) {
    const uri = this.formatQuestionnaireUri(
      assessment.questionnaire,
      lang.value
    )
    return this.getQuestionnairesOfLang(uri).catch(e => {
      const URI = this.formatQuestionnaireUri(assessment.questionnaire, '')
      return this.getQuestionnairesOfLang(URI)
    })
  }

  formatQuestionnaireUri(questionnaireRepo, langVal) {
    // NOTE: Using temp test repository for aRMT defs
    const repository = TEST_ARMT_DEF
      ? questionnaireRepo.repository.replace(
          ARMTDefBranchProd,
          ARMTDefBranchTest
        )
      : questionnaireRepo.repository
    let uri = repository + questionnaireRepo.name + '/'
    uri += questionnaireRepo.name + questionnaireRepo.type
    if (langVal !== '') {
      uri += '_' + langVal
    }
    uri += questionnaireRepo.format
    console.log(uri)
    return uri
  }

  getQuestionnairesOfLang(URI) {
    return this.http.get(URI).toPromise()
  }

  formatQuestionsHeaders(questions) {
    const questionsFormated = questions
    let sectionHeader = questionsFormated[0].section_header
    for (let i = 0; i < questionsFormated.length; i++) {
      if (questionsFormated[i].section_header === '') {
        questionsFormated[i].section_header = sectionHeader
      } else {
        sectionHeader = questionsFormated[i].section_header
      }
    }
    return questionsFormated
  }

  migrateToLatestVersion() {
    // NOTE: Migrate ENROLMENTDATE (from V0.3.1- to V0.3.2+)
    const enrolmentDate = this.storage.get(StorageKeys.ENROLMENTDATE)
    const referenceDate = this.storage.get(StorageKeys.REFERENCEDATE)
    Promise.all([enrolmentDate, referenceDate]).then(dates => {
      if (dates[0] === undefined) {
        this.storage.set(StorageKeys.ENROLMENTDATE, referenceDate)
      }
    })
  }
}
