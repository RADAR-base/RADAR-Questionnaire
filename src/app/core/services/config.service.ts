import 'rxjs/add/operator/toPromise'

import { HttpClient } from '@angular/common/http'
import { Inject, Injectable } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version/ngx'

import {
  DefaultAppVersion, DefaultProtocolBranch,
  DefaultProtocolEndPoint,
  DefaultProtocolPath,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI,
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment } from '../../shared/models/assessment'
import { Question } from '../../shared/models/question'
import { Utility } from '../../shared/utilities/util'
import { FirebaseAnalyticsService } from './firebaseAnalytics.service'
import { LocalizationService } from './localization.service'
import { NotificationService } from './notification.service'
import { SchedulingService } from './scheduling.service'
import { StorageService } from './storage.service'
import { REMOTE_CONFIG_SERVICE, RemoteConfigService } from './remote-config.service'
import { ConfigKeys } from '../../shared/enums/config'

@Injectable()
export class ConfigService {
  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private schedule: SchedulingService,
    private notifications: NotificationService,
    private util: Utility,
    private localization: LocalizationService,
    private appVersionPlugin: AppVersion,
    private firebaseAnalytics: FirebaseAnalyticsService,
    @Inject(REMOTE_CONFIG_SERVICE) private remoteConfig: RemoteConfigService,
  ) {}

  fetchConfigState(force: boolean) {
    return Promise.all([
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.SCHEDULE_VERSION),
      this.storage.get(StorageKeys.APP_VERSION),
      this.pullProtocol()
    ]).then(([configVersion, scheduleVersion, storedAppVersion, response]) => {
      if (!response) {
        return Promise.reject({
          message: 'No response from server'
        })
      }
      let appVersion = DefaultAppVersion
      this.appVersionPlugin.getVersionNumber().then(res => (appVersion = res))
      console.log('Fetching with app version ', appVersion)

      const responseData: any = JSON.parse(response)
      if (
        configVersion !== responseData.version ||
        scheduleVersion !== responseData.version ||
        storedAppVersion !== appVersion ||
        force
      ) {
        const assessments = this.formatPulledProtocol(responseData.protocols)
        const {
          negative: scheduledAssessments,
          positive: clinicalAssessments
        } = this.util.partition(assessments, a => a.protocol.clinicalProtocol)

        this.storage.set(
          StorageKeys.HAS_CLINICAL_TASKS,
          clinicalAssessments.length > 0
        )

        return Promise.all([
          this.storage.set(StorageKeys.APP_VERSION, appVersion),
          this.storage.set(StorageKeys.CONFIG_VERSION, responseData.version),
          this.updateAssessments(
            StorageKeys.CONFIG_CLINICAL_ASSESSMENTS,
            clinicalAssessments
          ),
          this.updateAssessments(
            StorageKeys.CONFIG_ASSESSMENTS,
            scheduledAssessments
          )
        ])
          .then(() => this.schedule.generateSchedule(true))
          .then(() => this.rescheduleNotifications())
          .then(() => this.setFirebaseUserProperties())
          .then(() =>
            this.firebaseAnalytics.logEvent('config_update', {
              config_version: String(configVersion),
              schedule_version: String(scheduleVersion),
              app_version: appVersion
            })
          )
      } else {
        console.log(
          'NO CONFIG UPDATE. Version of protocol.json has not changed.'
        )
        return this.schedule.generateSchedule(false)
      }
    })
  }

  private updateAssessments(key: StorageKeys, assessments: Assessment[]) {
    return this.storage
      .set(key, assessments)
      .then(() => this.pullQuestionnaires(key))
  }

  setFirebaseUserProperties() {
    return Promise.all([
      this.storage.get(StorageKeys.PARTICIPANTLOGIN),
      this.getProjectName(),
      this.storage.get(StorageKeys.SOURCEID),
      this.storage.get(StorageKeys.ENROLMENTDATE),
      this.storage.get(StorageKeys.PARTICIPANTID),
      this.storage.get(StorageKeys.BASE_URI)
    ]).then(
      ([subjectId, projectId, sourceId, enrolmentDate, humanReadableId, baseUri]) =>
        this.firebaseAnalytics.setUserProperties({
          subjectId: subjectId,
          projectId: projectId,
          sourceId: sourceId,
          baseUrl: baseUri,
          enrolmentDate: String(enrolmentDate),
          humanReadableId: humanReadableId
        })
    )
  }

  rescheduleNotifications() {
    return this.notifications
      .cancel()
      .then(() => this.notifications.publish())
      .then(() => console.log('NOTIFICATIONS scheduled after config change'))
      .then(() =>
        this.firebaseAnalytics.logEvent('notification_rescheduled', {})
      )
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
    return this.remoteConfig.read()
      .catch(e => {
        console.error("Failed to fetch Firebase config, using empty config instead", e)
        throw e;
      })
      .then(cfg => Promise.all([
        this.getProjectName(),
        cfg.getOrDefault(ConfigKeys.PROTOCOL_BASE_URL, DefaultProtocolEndPoint),
        cfg.getOrDefault(ConfigKeys.PROTOCOL_PATH, DefaultProtocolPath),
        cfg.getOrDefault(ConfigKeys.PROTOCOL_BRANCH, DefaultProtocolBranch)]))
      .then(([projectName, path, baseUrl, branch]) => {
        if (!projectName) {
          console.error(
            'Unknown project name : ' + projectName + '. Cannot pull protocols.'
          )
          return Promise.reject()
        }
        const URI = [
          baseUrl,
          projectName,
          `${path}?ref=${branch}`,
        ].join('/')
        return this.http
          .get(URI)
          .toPromise()
          .then(res => atob(res['content']))
      })
  }

  getProjectName() {
    return this.storage.get(StorageKeys.PROJECTNAME)
  }

  formatPulledProtocol(protocols: Assessment[]): Assessment[] {
    return protocols.map(p => {
      p.questionnaire.type = DefaultQuestionnaireTypeURI
      p.questionnaire.format = DefaultQuestionnaireFormatURI
      return p
    })
  }

  pullQuestionnaires(storageKey): Promise<Assessment[]> {
    return this.storage.get(storageKey).then(assessments => {
      const localizedQuestionnaires = assessments.map(a =>
        this.pullQuestionnaireLang(a)
      )

      return Promise.all(localizedQuestionnaires).then(res => {
        assessments.forEach((a, i) => {
          a.questions = this.formatQuestionsHeaders(res[i])
        })
        return this.storage.set(storageKey, assessments)
      })
    })
  }

  pullQuestionnaireLang(assessment): Promise<Object> {
    const uri = this.formatQuestionnaireUri(
      assessment.questionnaire,
      this.localization.getLanguage().value
    )
    return this.getQuestionnairesOfLang(uri).catch(e => {
      const URI = this.formatQuestionnaireUri(assessment.questionnaire, '')
      return this.getQuestionnairesOfLang(URI)
    })
  }

  formatQuestionnaireUri(questionnaireRepo, langVal: string) {
    let uri = questionnaireRepo.repository + questionnaireRepo.name + '/'
    uri += questionnaireRepo.name + questionnaireRepo.type
    if (langVal !== '') {
      uri += '_' + langVal
    }
    uri += questionnaireRepo.format
    console.log(uri)
    return uri
  }

  getQuestionnairesOfLang(URI): Promise<Question[]> {
    return this.http
      .get(URI)
      .toPromise()
      .then(res => {
        if (res instanceof Array) {
          return Promise.resolve(res)
        } else {
          return Promise.reject({
            message: 'URL does not contain an array of questions'
          })
        }
      }) as Promise<Question[]>
  }

  formatQuestionsHeaders(questions) {
    questions.forEach((q, i) => {
      if (!q.section_header && i > 0) {
        q.section_header = questions[i - 1].section_header
      }
    })
    return questions
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
