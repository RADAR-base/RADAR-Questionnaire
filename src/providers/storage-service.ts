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

  global:any = {}

  constructor(
    private storage: Storage
  ) {
    const setStoragePromise = this.prepareStorage()
    Promise.resolve(setStoragePromise)
  }

  init(participantId, participantLogin, projectName, sourceId, language, createdDate, createdDateMidnight) {
    let allKeys = this.getAllKeys()
    return allKeys.then((keys) => {
      if(keys.length <= 6){
        let enrolmentDateTime = new Date(createdDate)
        let referenceDateTime = new Date(createdDateMidnight)
        let enrolmentDate = this.set(StorageKeys.ENROLMENTDATE, enrolmentDateTime.getTime())
        let referenceDate = this.set(StorageKeys.REFERENCEDATE, referenceDateTime.getTime())

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
    this.global[key.toString()] = value
    return this.storage.set(key.toString(), value)
  }

  setFetchedConfiguration(config) {
    this.set(StorageKeys.CONFIG_VERSION, config.version)
    this.set(StorageKeys.CONFIG_ASSESSMENTS, config.assessments)
    return Promise.resolve(true)
  }

  get(key) {
    if(this.global[key.toString()] && key.toString()){
      return Promise.resolve(this.global[key.toString()])
    } else {
      return this.storage.get(key.toString()).then((value) => {
        this.global[key.toString()] = value
        return Promise.resolve(value)
      })
    }
  }

  remove(key: StorageKeys) {
    return this.storage.remove(key.toString())
      .then((res) => { return res })
      .catch((error) => this.handleError(error))
  }

  getAllKeys(forceLocal=false) {
    const globalKeys = Object.keys(this.global)
    let promise = Promise.resolve(globalKeys)
    if(forceLocal) {
      promise = this.storage.keys()
    }
    return promise
  }

  prepareStorage() {
    return this.getAllKeys()
      .then((keys) => {
        let promises = []
        promises.push(Promise.resolve(keys))
        for (var i = 0; i < keys.length; i++){
          promises.push(this.storage.get(keys[i]))
        }
        return Promise.all(promises)
      })
      .then((store) => {
        const keys = store[0]
        for(var i = 1; i < store.length; i++){
          this.global[keys[(i-1)].toString()] = store[i]
        }
        return Promise.resolve("Store set")
      })
  }

  getAssessment (task:Task) {
    let defaultAssessment = this.get(StorageKeys.CONFIG_ASSESSMENTS)
    let clinicalAssesment = this.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
    return Promise.all([defaultAssessment, clinicalAssesment])
      .then((assessments) => {
        for(var i = 0; i<assessments.length; i++){
          for(var j = 0; j<assessments[i].length; j++)
            if(assessments[i][j].name == task.name) {
              return assessments[i][j]
            }
        }
      })
  }

  getClinicalAssessment (task:Task) {
    return this.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
                .then((assessments) => {
                  for(var i = 0; i<assessments.length; i++){
                    if(assessments[i].name == task.name) {
                      return assessments[i]
                    }
                  }
                })
  }

  getAssessmentAvsc (task: Task) {
    return this.getAssessment(task)
      .then((assessment) => {
        return assessment.questionnaire
      })
  }

  updateAssessment (assessment:Assessment) {
    let key = StorageKeys.CONFIG_ASSESSMENTS
    this.get(key).then((assessments) => {
      var updatedAssessments = assessments
      for(var i = 0; i<assessments.length;i++){
        if(updatedAssessments[i].name == assessment.name){
          updatedAssessments[i] = assessment
        }
      }
      this.set(key, updatedAssessments)
    })
  }

  clearStorage() {
    this.global = {}
    return this.storage.clear()
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'error'
    return Observable.throw(errMsg)
  }

}
