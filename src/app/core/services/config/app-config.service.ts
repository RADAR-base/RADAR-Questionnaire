import { Injectable } from '@angular/core'
import { App } from '@capacitor/app'

import {
  DefaultAppVersion,
  DefaultScheduleVersion,
  DefaultSettingsNotifications,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { setDateTimeToMidnightEpoch } from '../../../shared/utilities/time'
import { Capacitor } from '@capacitor/core'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class AppConfigService {
  private readonly CONFIG_STORE = {
    SCHEDULE_VERSION: StorageKeys.SCHEDULE_VERSION,
    SCHEDULE_HASH_URL: StorageKeys.SCHEDULE_HASH_URL,
    APP_VERSION: StorageKeys.APP_VERSION,
    UTC_OFFSET: StorageKeys.UTC_OFFSET,
    UTC_OFFSET_PREV: StorageKeys.UTC_OFFSET_PREV,
    REFERENCEDATE: StorageKeys.REFERENCEDATE,
    SETTINGS_NOTIFICATIONS: StorageKeys.SETTINGS_NOTIFICATIONS,
    SETTINGS_WEEKLYREPORT: StorageKeys.SETTINGS_WEEKLYREPORT
  }

  constructor(public storage: StorageService) {}

  init(enrolmentDate) {
    return Promise.all([
      this.setNotificationSettings(DefaultSettingsNotifications),
      this.setReportSettings(DefaultSettingsWeeklyReport),
      this.setAppVersion(DefaultAppVersion),
      this.setUTCOffset(new Date().getTimezoneOffset()),
      this.setReferenceDate(enrolmentDate)
    ])
  }

  async getAppVersion() {
    if (Capacitor.isNativePlatform()) {
      const appInfo = await App.getInfo()
      return appInfo.version
    }
    else return DefaultAppVersion
  }

  getStoredAppVersion() {
    return this.storage.get(this.CONFIG_STORE.APP_VERSION)
  }

  getScheduleVersion() {
    return this.storage.get(this.CONFIG_STORE.SCHEDULE_VERSION)
  }

  getScheduleHashUrl() {
    return this.storage.get(this.CONFIG_STORE.SCHEDULE_HASH_URL)
  }

  getNotificationSettings() {
    return this.storage.get(this.CONFIG_STORE.SETTINGS_NOTIFICATIONS)
  }

  getReportSettings() {
    return this.storage.get(this.CONFIG_STORE.SETTINGS_WEEKLYREPORT)
  }

  getUTCOffset() {
    return this.storage.get(this.CONFIG_STORE.UTC_OFFSET)
  }

  getPrevUTCOffset() {
    return this.storage.get(this.CONFIG_STORE.UTC_OFFSET_PREV)
  }

  getReferenceDate() {
    return this.storage.get(this.CONFIG_STORE.REFERENCEDATE)
  }

  setNotificationSettings(settings) {
    return this.storage.set(this.CONFIG_STORE.SETTINGS_NOTIFICATIONS, settings)
  }

  setReportSettings(settings) {
    return this.storage.set(this.CONFIG_STORE.SETTINGS_WEEKLYREPORT, settings)
  }

  setAppVersion(version) {
    return this.storage.set(this.CONFIG_STORE.APP_VERSION, version)
  }

  setScheduleVersion(version) {
    return this.storage.set(this.CONFIG_STORE.SCHEDULE_VERSION, version)
  }

  setScheduleHashUrl(hash) {
    return this.storage.set(this.CONFIG_STORE.SCHEDULE_HASH_URL, hash)
  }

  setUTCOffset(offset) {
    return this.storage.set(this.CONFIG_STORE.UTC_OFFSET, offset)
  }

  setPrevUTCOffset(offset) {
    return this.storage.set(this.CONFIG_STORE.UTC_OFFSET_PREV, offset)
  }

  setReferenceDate(enrolmentDate) {
    return this.storage.set(
      this.CONFIG_STORE.REFERENCEDATE,
      setDateTimeToMidnightEpoch(new Date(enrolmentDate))
    )
  }

  reset() {
    return Promise.all([
      this.setScheduleVersion(null),
      this.setAppVersion(null),
      this.setUTCOffset(null),
      this.setReferenceDate(null),
      this.setReportSettings(null),
      this.setNotificationSettings(null),
      this.setScheduleHashUrl(null)
    ])
  }
}
