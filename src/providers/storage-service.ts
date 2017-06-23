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

  init(patientId:String) {
    let allKeys = this.getAllKeys()
    allKeys.then((keys) => {
      console.log(keys)
      if(keys.length==0){
        let today = new Date()
        //this.set(StorageKeys.REFERENCEDATE, today.getTime())
        this.set(StorageKeys.REFERENCEDATE, 1496952304184)
        this.set(StorageKeys.PATIENTID, patientId)
        this.set(StorageKeys.LANGUAGE, DefaultSettingsSupportedLanguages[0])
        this.set(StorageKeys.SETTINGS_NOTIFICATIONS, DefaultSettingsNotifications)
        this.set(StorageKeys.SETTINGS_WEEKLYREPORT, DefaultSettingsWeeklyReport)
        this.set(StorageKeys.SETTINGS_LANGUAGES, DefaultSettingsSupportedLanguages)
        this.set(StorageKeys.SCHEDULE_VERSION, DefaultScheduleVersion)
      }
    }).catch((error) => {
      this.handleError(error)
    })
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: StorageKeys, value: any) {
    this.storage.set(key.toString(), value)
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
