import { Injectable } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version'

import { LanguageMap } from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { NotificationGeneratorService } from '../../../core/services/notifications/notification-generator.service'
import { NotificationService } from '../../../core/services/notifications/notification.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { StorageService } from '../../../core/services/storage/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class SettingsService {
  constructor(
    private schedule: ScheduleService,
    private storage: StorageService,
    private appVersion: AppVersion,
    private notificationGenerator: NotificationGeneratorService,
    private notifications: NotificationService,
    public localization: LocalizationService,
    private config: ConfigService
  ) {}

  consoleLogNotifications() {
    this.schedule
      .getTasks()
      .then(tasks => this.notificationGenerator.consoleLogNotifications(tasks))
  }

  consoleLogSchedule() {
    console.log('SCHEDULE SETTINGS')
    this.schedule.consoleLogSchedule()
  }

  get() {
    return {
      configVersion: this.storage.get(StorageKeys.CONFIG_VERSION),
      scheduleVersion: this.storage.get(StorageKeys.SCHEDULE_VERSION),
      participantID: this.storage.get(StorageKeys.PARTICIPANTID),
      projectName: this.storage.get(StorageKeys.PROJECTNAME),
      enrolmentDate: this.storage.get(StorageKeys.ENROLMENTDATE),
      notificationSettings: this.storage.get(
        StorageKeys.SETTINGS_NOTIFICATIONS
      ),
      languagesSelectable: this.storage.get(StorageKeys.SETTINGS_LANGUAGES),
      weeklyReport: this.storage.get(StorageKeys.SETTINGS_WEEKLYREPORT),
      cache: this.storage.get(StorageKeys.CACHE_ANSWERS),
      appVersion: this.appVersion.getVersionNumber(),
      language: Promise.resolve(this.getLanguage()),
      lastUploadDate: this.storage.get(StorageKeys.LAST_UPLOAD_DATE)
    }
  }

  setNotifSettings(notificationSettings) {
    return this.storage.set(
      StorageKeys.SETTINGS_NOTIFICATIONS,
      notificationSettings
    )
  }

  setReportSettings(reportSettings) {
    return this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, reportSettings)
  }

  generateTestNotif() {
    return this.notifications.sendTestNotification()
  }

  reset() {
    return this.storage.clearStorage()
  }

  getLanguage() {
    return this.localization.getLanguage()
  }

  reloadConfig() {
    return this.config.fetchConfigState(true)
  }

  changeLanguage(langValue) {
    const lang = {
      label: LanguageMap[langValue],
      value: langValue
    }
    return this.localization
      .setLanguage(lang)
      .then(() => this.config.updateConfigStateOnLanguageChange())
  }
}
