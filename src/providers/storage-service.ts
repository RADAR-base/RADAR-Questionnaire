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

  global:any = {}

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
    this.global[key.toString()] = value
    return this.storage.set(key.toString(), value)
  }

  setFetchedConfiguration(config) {
    this.set(StorageKeys.CONFIG_VERSION, config.version)
    this.set(StorageKeys.CONFIG_ASSESSMENTS, config.assessments)
    return Promise.resolve(true)
  }

  get(key) {
    console.log(this.global)
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

  getAllKeys() {
    return this.storage.keys()
  }

  prepareStorage() {
    let configVersion = this.get(StorageKeys.CONFIG_VERSION)
    let scheduleVersion = this.get(StorageKeys.SCHEDULE_VERSION)
    let participantId = this.get(StorageKeys.PARTICIPANTID)
    let projectName = this.get(StorageKeys.PROJECTNAME)
    let referenceDate = this.get(StorageKeys.REFERENCEDATE)
    let language = this.get(StorageKeys.LANGUAGE)
    let settingsNotification = this.get(StorageKeys.SETTINGS_NOTIFICATIONS)
    let settingsLanguages = this.get(StorageKeys.SETTINGS_NOTIFICATIONS)
    let settingsWeeklyReport = this.get(StorageKeys.SETTINGS_WEEKLYREPORT)
    let cache = this.get(StorageKeys.CACHE_ANSWERS)
    let settings = [configVersion, scheduleVersion, participantId, projectName,
      referenceDate, language, settingsNotification, settingsLanguages, settingsWeeklyReport,
      cache]
    return Promise.all(settings)
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
