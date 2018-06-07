import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { StorageService } from '../providers/storage-service'
import { StorageKeys } from '../enums/storage'
import { SchedulingService } from '../providers/scheduling-service'
import { DefaultProtocolEndPoint } from '../assets/data/defaultConfig'
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ConfigService {

  URI_protocol: string = '/protocol.json'
  URI_questionnaireType: string = '_armt'
  URI_questionnaireFormat: string = '.json'

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private schedule: SchedulingService,
  ) {}

  fetchConfigState() {
    return this.storage.get(StorageKeys.CONFIG_VERSION)
    .then((configVersion) => {
      return this.pullProtocol()
      .then((res) => {
        let response: any = JSON.parse(res)
        if(configVersion != response.version) {
          this.storage.set(StorageKeys.HAS_CLINICAL_TASKS, false)
          let protocolFormated = this.formatPulledProcotol(response.protocols)
          let scheduledAssessments = []
          let clinicalAssessments = []
          for(var i=0; i < protocolFormated.length; i++) {
              let clinical = protocolFormated[i]['protocol']['clinicalProtocol']
              if(clinical){
                this.storage.set(StorageKeys.HAS_CLINICAL_TASKS, true)
                clinicalAssessments.push(protocolFormated[i])
              } else {
                scheduledAssessments.push(protocolFormated[i])
              }
          }
          this.storage.set(StorageKeys.CONFIG_VERSION, response.version)
          this.storage.set(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS, clinicalAssessments)
          .then(() =>{
            console.log("Pulled clinical questionnaire")
            this.pullQuestionnaires(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
          })
          this.storage.set(StorageKeys.CONFIG_ASSESSMENTS, scheduledAssessments)
          .then(() => {
            console.log("Pulled questionnaire")
            this.pullQuestionnaires(StorageKeys.CONFIG_ASSESSMENTS)
          })
        } else {
          console.log('NO CONFIG UPDATE. Version of protocol.json has not changed.')
          this.schedule.generateSchedule()
        }
      }).catch(e => console.log(e))
    })
  }

  pullProtocol() {
    return this.getProjectName().then((projectName) => {
      if(projectName){
        let URI = DefaultProtocolEndPoint + projectName + this.URI_protocol
        return this.http.get(URI, { responseType: 'text'} ).toPromise()
      } else {
        console.error('Unknown project name. Cannot pull protocols.')
      }
    })
  }

  getProjectName() {
    return this.storage.get(StorageKeys.PROJECTNAME)
  }

  formatPulledProcotol(protocols) {
    var protocolsFormated = protocols
    for(var i = 0; i<protocolsFormated.length; i++){
      protocolsFormated[i].questionnaire['type'] = this.URI_questionnaireType
      protocolsFormated[i].questionnaire['format'] = this.URI_questionnaireFormat
    }
    return protocolsFormated
  }

  retrieveLanguageKeys(questionnaire_URI) {
    var langs = []
    for(var key in questionnaire_URI) langs.push(key)
    var langsKeyValEmpty = {}
    for(var val of langs) langsKeyValEmpty[val] = ""
    return langsKeyValEmpty
  }

  pullQuestionnaires(storageKey) {
    let assessments = this.storage.get(storageKey)
    let lang = this.storage.get(StorageKeys.LANGUAGE)
    Promise.all([assessments, lang])
    .then((vars) => {
      let assessments = vars[0]
      let lang = vars[1]

      let promises = []
      for(var i = 0; i < assessments.length; i++) {
        promises.push(this.pullQuestionnaireLang(assessments[i], lang))
      }
      Promise.all(promises)
      .then((res) => {
        let assessmentUpdate = assessments
        for(var i = 0; i < assessments.length; i++) {
          assessmentUpdate[i]['questions'] = this.formatQuestionsHeaders(res[i])
        }
        this.storage.set(storageKey, assessmentUpdate)
        .then(() => this.schedule.generateSchedule())
      })
    })
  }

  pullQuestionnaireLang(assessment, lang) {
    let uri = this.formatQuestionnaireUri(assessment.questionnaire, lang.value)
    return this.getQuestionnairesOfLang(uri)
    .catch(e => {
      let uri = this.formatQuestionnaireUri(assessment.questionnaire, '')
      return this.getQuestionnairesOfLang(uri)
    })
  }

  formatQuestionnaireUri(questionnaireRepo, langVal) {
    var uri = questionnaireRepo.repository + questionnaireRepo.name + '/'
    uri += questionnaireRepo.name + questionnaireRepo.type
    if(langVal != '') {
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
    var questionsFormated = questions
    let sectionHeader = questionsFormated[0].section_header
    for(var i = 0; i < questionsFormated.length; i++){
      if(questionsFormated[i].section_header == "") {
        questionsFormated[i].section_header = sectionHeader
      } else {
        sectionHeader = questionsFormated[i].section_header
      }
    }
    return questionsFormated
  }

}
