import { Injectable } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version/ngx'

import {
  DefaultAppVersion,
  DefaultScheduleVersion,
  DefaultSettingsNotifications,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { setDateTimeToMidnight } from '../../../shared/utilities/time'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class AppConfigService {
  private readonly CONFIG_STORE = {
    SCHEDULE_VERSION: StorageKeys.SCHEDULE_VERSION,
    APP_VERSION: StorageKeys.APP_VERSION,
    UTC_OFFSET: StorageKeys.UTC_OFFSET,
    UTC_OFFSET_PREV: StorageKeys.UTC_OFFSET_PREV,
    REFERENCEDATE: StorageKeys.REFERENCEDATE,
    SETTINGS_NOTIFICATIONS: StorageKeys.SETTINGS_NOTIFICATIONS,
    SETTINGS_WEEKLYREPORT: StorageKeys.SETTINGS_WEEKLYREPORT
  }

  constructor(public storage: StorageService, private appVersion: AppVersion) {}

  init(enrolmentDate) {
    return Promise.all([
      this.setNotificationSettings(DefaultSettingsNotifications),
      this.setReportSettings(DefaultSettingsWeeklyReport),
      this.setAppVersion(DefaultAppVersion),
      this.setUTCOffset(new Date().getTimezoneOffset()),
      this.setReferenceDate(enrolmentDate)
    ])
  }

  getAppVersion() {
    return this.appVersion.getVersionNumber().catch(() => DefaultAppVersion)
  }

  getStoredAppVersion() {
    return this.storage.get(this.CONFIG_STORE.APP_VERSION)
  }

  getScheduleVersion() {
    return this.storage.get(this.CONFIG_STORE.SCHEDULE_VERSION)
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

  setUTCOffset(offset) {
    return this.storage.set(this.CONFIG_STORE.UTC_OFFSET, offset)
  }

  setPrevUTCOffset(offset) {
    return this.storage.set(this.CONFIG_STORE.UTC_OFFSET_PREV, offset)
  }

  setReferenceDate(enrolmentDate) {
    return this.storage.set(
      this.CONFIG_STORE.REFERENCEDATE,
      setDateTimeToMidnight(new Date(enrolmentDate)).getTime()
    )
  }

  reset() {
    return Promise.all([
      this.setScheduleVersion(null),
      this.setAppVersion(null),
      this.setUTCOffset(null),
      this.setReferenceDate(null),
      this.setReportSettings(null),
      this.setNotificationSettings(null)
    ])
  }
}
