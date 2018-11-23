import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'

import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { throwError as observableThrowError } from 'rxjs'

import {
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
  global: any = {}

  constructor(private storage: Storage) {
    const setStoragePromise = this.prepareStorage()
    Promise.resolve(setStoragePromise)
  }

  init(
    participantId,
    participantLogin,
    projectName,
    sourceId,
    language,
    createdDate,
    createdDateMidnight
  ) {
    const allKeys = this.getAllKeys()
    return allKeys
      .then(keys => {
        // TODO: Find out why this is hard-coded?
        if (keys.length <= 7) {
          const enrolmentDateTime = new Date(createdDate)
          const referenceDateTime = new Date(createdDateMidnight)
          const enrolmentDate = this.set(
            StorageKeys.ENROLMENTDATE,
            enrolmentDateTime.getTime()
          )
          const referenceDate = this.set(
            StorageKeys.REFERENCEDATE,
            referenceDateTime.getTime()
          )

          const pId = this.set(StorageKeys.PARTICIPANTID, participantId)
          const pLogin = this.set(
            StorageKeys.PARTICIPANTLOGIN,
            participantLogin
          )
          const pName = this.set(StorageKeys.PROJECTNAME, projectName)
          const sId = this.set(StorageKeys.SOURCEID, sourceId)

          const lang = this.set(StorageKeys.LANGUAGE, language)
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

          return Promise.all([
            pId,
            pName,
            pLogin,
            sId,
            lang,
            notif,
            report,
            langs,
            version
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
    this.global[key.toString()] = value
    return this.storage.set(key.toString(), value)
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

  get(key) {
    if (this.global[key.toString()] && key.toString()) {
      return Promise.resolve(this.global[key.toString()])
    } else {
      return this.storage.get(key.toString()).then(value => {
        this.global[key.toString()] = value
        return Promise.resolve(value)
      })
    }
  }

  remove(key: StorageKeys) {
    return this.storage
      .remove(key.toString())
      .then(res => {
        return res
      })
      .catch(error => this.handleError(error))
  }

  getAllKeys() {
    return this.storage.keys()
  }

  prepareStorage() {
    return this.getAllKeys()
      .then(keys => {
        const promises = []
        promises.push(Promise.resolve(keys))
        for (let i = 0; i < keys.length; i++) {
          promises.push(this.storage.get(keys[i]))
        }
        return Promise.all(promises)
      })
      .then(store => {
        const keys = store[0]
        for (let i = 1; i < store.length; i++) {
          this.global[keys[i - 1].toString()] = store[i]
        }
        return Promise.resolve('Store set')
      })
  }

  getAssessment(task: Task) {
    const defaultAssessment = this.get(StorageKeys.CONFIG_ASSESSMENTS)
    const clinicalAssesment = this.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
    return Promise.all([defaultAssessment, clinicalAssesment]).then(
      assessments => {
        for (let i = 0; i < assessments.length; i++) {
          for (let j = 0; j < assessments[i].length; j++) {
            if (assessments[i][j].name === task.name) {
              return assessments[i][j]
            }
          }
        }
      }
    )
  }

  getClinicalAssessment(task: Task) {
    return this.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS).then(
      assessments => {
        for (let i = 0; i < assessments.length; i++) {
          if (assessments[i].name === task.name) {
            return assessments[i]
          }
        }
      }
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
