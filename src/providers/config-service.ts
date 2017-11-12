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

  constructor(
    public http: HttpClient,
    private storage: StorageService,
    private schedule: SchedulingService,
  ) {}

  fetchConfigState() {
    this.storage.get(StorageKeys.CONFIG_VERSION)
    .then((version) => {
      this.pullProtocol()
      .then((res) => {
        let response: any = res
        if(version != response.version) {
          let protocolFormated = this.formatPulledProcotol(response.protocols)
          this.storage.set(StorageKeys.CONFIG_VERSION, response.version)
          this.storage.set(StorageKeys.CONFIG_ASSESSMENTS, protocolFormated)
          .then(() =>{
            this.pullQuestionnaires()
            this.schedule.generateSchedule()
          })
        } else {
          console.log('NO CONFIG UPDATE. Version of protocol.json has not changed.')
        }
      })
    })
  }

  pullProtocol() {
    return this.getProjectName().then((projectName) => {
      if(projectName){
        let URI = DefaultProtocolEndPoint + projectName + this.URI_protocol
        return this.http.get(URI).toPromise()
      } else {
        console.error('Unknown project name. Cannot pull protocols.')
      }
    })
  }

  getProjectName() {
    return this.storage.get(StorageKeys.PROJECTNAME)
  }

  formatPulledProcotol(protocol) {
    var protocolFormated = protocol
    for(var i = 0; i < protocolFormated.length; i++){
      let langFormat = this.retrieveLanguageKeys(protocolFormated[i].questionnaire_URI)
      protocolFormated[i].questions = langFormat
    }
    return protocolFormated
  }

  retrieveLanguageKeys(questionnaire_URI) {
    var langs = []
    for(var key in questionnaire_URI) langs.push(key)
    var langsKeyValEmpty = {}
    for(var val of langs) langsKeyValEmpty[val] = ""
    return langsKeyValEmpty
  }

  pullQuestionnaires() {
    this.storage.get(StorageKeys.CONFIG_ASSESSMENTS)
    .then((assessments) => {
      var assessmentsUpdate = assessments
      for(var i = 0; i < assessmentsUpdate.length; i++) {
        this.pullQuestionnaireLangs(assessmentsUpdate[i].questionnaire_URI)
        .then((questionnaires) => {
          assessmentsUpdate.questions = questionnaires
          this.storage.set(StorageKeys.CONFIG_ASSESSMENTS, assessmentsUpdate)
        })
      }
    })
  }

  pullQuestionnaireLangs(qUriLangs) {
    var langs = []
    for(var key in qUriLangs) langs.push(key)
    var promises = []
    for(var val of langs) {
      promises.push(this.getQuestionnairesOfLang(qUriLangs[val]))
    }
    return Promise.all(promises)
    .then((qLangs) => {
      var questionnaires = {}
      for(var i = 0; i < langs.length; i++) questionnaires[langs[i]] = qLangs[i]
      return questionnaires
    })
  }

  getQuestionnairesOfLang(URI) {
    return this.http.get(URI).toPromise()
  }

}
