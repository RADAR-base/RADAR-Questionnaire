import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'

import { Injectable } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version/ngx'
import { Storage } from '@ionic/storage'
import { throwError as observableThrowError } from 'rxjs'

import {
  DefaultAppVersion,
  DefaultScheduleVersion,
  DefaultSettingsNotifications,
  DefaultSettingsSupportedLanguages,
  DefaultSettingsWeeklyReport
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment } from '../../shared/models/assessment'
import { Task } from '../../shared/models/task'

@Injectable()
export class StorageService {
  global: { [key: string]: any } = {}

  constructor(private storage: Storage, private appVersionPlugin: AppVersion) {
    const setStoragePromise = this.prepareStorage()
    Promise.resolve(setStoragePromise)
  }

  init(
    participantId,
    participantLogin,
    projectName,
    sourceId,
    createdDate,
    createdDateMidnight
  ) {
    return this.getAllKeys()
      .then(keys => {
        // TODO: Find out why this is hard-coded?
        if (keys.length <= 7) {
          const enrolmentDate = this.set(
            StorageKeys.ENROLMENTDATE,
            new Date(createdDate).getTime()
          )
          const referenceDate = this.set(
            StorageKeys.REFERENCEDATE,
            new Date(createdDateMidnight).getTime()
          )
          const pId = this.set(StorageKeys.PARTICIPANTID, participantId)
          const pLogin = this.set(
            StorageKeys.PARTICIPANTLOGIN,
            participantLogin
          )
          const pName = this.set(StorageKeys.PROJECTNAME, projectName)
          const sId = this.set(StorageKeys.SOURCEID, sourceId)

          const notif = this.set(
            StorageKeys.SETTINGS_NOTIFICATIONS,
            DefaultSettingsNotifications
          )
          const report = this.set(
            StorageKeys.SETTINGS_WEEKLYREPORT,
            DefaultSettingsWeeklyReport
          )
          const langs = this.set(
            StorageKeys.SETTINGS_LANGUAGES,
            DefaultSettingsSupportedLanguages
          )
          const version = this.set(
            StorageKeys.SCHEDULE_VERSION,
            DefaultScheduleVersion
          )
          const utc = this.set(
            StorageKeys.UTC_OFFSET,
            new Date().getTimezoneOffset()
          )
          const cache = this.set(StorageKeys.CACHE_ANSWERS, {})
          let appVersion = DefaultAppVersion
          this.getAppVersion()
            .then(apV => {
              appVersion = apV
            })
            .catch(err => console.log('Cannot retrieve app version ', err))

          this.set(StorageKeys.APP_VERSION, appVersion)

          return Promise.all([
            pId,
            pName,
            pLogin,
            sId,
            notif,
            report,
            langs,
            version,
            utc,
            cache,
            enrolmentDate,
            referenceDate,
            appVersion
          ])
        }
      })
      .catch(error => {
        this.handleError(error)
      })
  }

  getStorageState() {
    return this.storage.ready()
  }

  set(key: StorageKeys, value: any): Promise<any> {
    const k = key.toString()
    this.global[k] = value
    return this.storage.set(k, value)
  }

  push(key: StorageKeys, value: any): Promise<any> {
    if (this.global[key.toString()]) this.global[key.toString()].push(value)
    else this.global[key.toString()] = [value]
    return this.storage.set(key.toString(), this.global[key.toString()])
  }

  setFetchedConfiguration(config) {
    this.set(StorageKeys.CONFIG_VERSION, config.version)
    this.set(StorageKeys.CONFIG_ASSESSMENTS, config.assessments)
    return Promise.resolve(true)
  }

  get(key: StorageKeys) {
    const k = key.toString()
    const local = this.global[k]
    if (local !== undefined) {
      return Promise.resolve(local)
    } else {
      return this.storage.get(k).then(value => {
        this.global[k] = value
        return value
      })
    }
  }

  remove(key: StorageKeys) {
    const k = key.toString()
    return this.storage
      .remove(k)
      .then(res => {
        this.global[k] = null
        return res
      })
      .catch(error => this.handleError(error))
  }

  getAllKeys(): Promise<string[]> {
    return this.storage.keys()
  }

  getAppVersion() {
    return this.appVersionPlugin.getVersionNumber()
  }

  prepareStorage() {
    return this.getAllKeys()
      .then(keys =>
        Promise.all(
          keys.map(k => this.storage.get(k).then(v => (this.global[k] = v)))
        )
      )
      .then(() => 'Store set')
  }

  getAssessment(task: Task) {
    return Promise.all([
      this.get(StorageKeys.CONFIG_ASSESSMENTS),
      this.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
    ]).then(([nonClinical, clinical]) => {
      return nonClinical.concat(clinical).find(a => a.name == task.name)
    })
  }

  getClinicalAssessment(task: Task) {
    return this.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS).then(assessments =>
      assessments.find(a => a.name === task.name)
    )
  }

  getAssessmentAvsc(task: Task) {
    return this.getAssessment(task).then(assessment => {
      return assessment.questionnaire
    })
  }

  updateAssessment(assessment: Assessment) {
    const key = StorageKeys.CONFIG_ASSESSMENTS
    this.get(key).then(assessments => {
      const updatedAssessments = assessments
      for (let i = 0; i < assessments.length; i++) {
        if (updatedAssessments[i].name === assessment.name) {
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
    const errMsg = error.message
      ? error.message
      : error.status
      ? `${error.status} - ${error.statusText}`
      : 'error'
    return observableThrowError(errMsg)
  }
}
