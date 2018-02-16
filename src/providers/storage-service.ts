import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'
import { Observable } from 'rxjs/Observable'
import { DefaultSettingsNotifications } from '../assets/data/defaultConfig'
import { DefaultSettingsWeeklyReport } from '../assets/data/defaultConfig'
import { DefaultSettingsSupportedLanguages } from '../assets/data/defaultConfig'
import { DefaultScheduleVersion } from '../assets/data/defaultConfig'
import { StorageKeys } from '../enums/storage'
import { Task } from '../models/task'
import { Assessment } from '../models/assessment'

@Injectable()
export class StorageService {

  constructor(
    private storage: Storage
  ) {

  }

  init(participantId, participantLogin, projectName, sourceId, createdDate, language) {
    let allKeys = this.getAllKeys()
    return allKeys.then((keys) => {
      if(keys.length <= 6){
        let today = new Date(createdDate)
        let time = this.set(StorageKeys.REFERENCEDATE, today.getTime())
        let pId = this.set(StorageKeys.PARTICIPANTID, participantId)
        let pLogin = this.set(StorageKeys.PARTICIPANTLOGIN, participantLogin)
        let pName = this.set(StorageKeys.PROJECTNAME, projectName)
        let sId = this.set(StorageKeys.SOURCEID, sourceId)
        let lang = this.set(StorageKeys.LANGUAGE, language)
        let notif = this.set(StorageKeys.SETTINGS_NOTIFICATIONS, DefaultSettingsNotifications)
        let report = this.set(StorageKeys.SETTINGS_WEEKLYREPORT, DefaultSettingsWeeklyReport)
        let langs = this.set(StorageKeys.SETTINGS_LANGUAGES, DefaultSettingsSupportedLanguages)
        let version = this.set(StorageKeys.SCHEDULE_VERSION, DefaultScheduleVersion)

        return Promise.all([pId, pName, pLogin, sId,lang, notif, report, langs, version])
      }
    }).catch((error) => {
      this.handleError(error)
    })
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: StorageKeys, value: any):Promise<any> {
    return this.storage.set(key.toString(), value)
  }

  setFetchedConfiguration(config) {
    this.set(StorageKeys.CONFIG_VERSION, config.version)
    this.set(StorageKeys.CONFIG_ASSESSMENTS, config.assessments)
    return Promise.resolve(true)
  }

  get(key: StorageKeys) {
    return this.storage.get(key.toString())
  }

  remove(key: StorageKeys) {
    return this.storage.remove(key.toString())
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  getAllKeys() {
    return this.storage.keys()
  }

  getAssessment (task:Task) {
    let key = StorageKeys.CONFIG_ASSESSMENTS
    return this.storage.get(key.toString())
                .then((assessments) => {
                  for(var i = 0; i<assessments.length; i++){
                    if(assessments[i].name == task.name) {
                      return assessments[i]
                    }
                  }
                })
  }

  updateAssessment (assessment:Assessment) {
    let key = StorageKeys.CONFIG_ASSESSMENTS
    this.storage.get(key.toString()).then((assessments) => {
      var updatedAssessments = assessments
      for(var i = 0; i<assessments.length;i++){
        if(updatedAssessments[i].name == assessment.name){
          updatedAssessments[i] = assessment
        }
      }
      this.storage.set(key.toString(), updatedAssessments)
    })
  }

  clearStorage() {
    return this.storage.clear()
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'error'
    return Observable.throw(errMsg)
  }

}
