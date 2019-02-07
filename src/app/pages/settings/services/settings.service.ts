import { Injectable } from '@angular/core'

import { LanguageMap } from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { NotificationService } from '../../../core/services/notifications/notification.service'

@Injectable()
export class SettingsService {
  constructor(
    private notifications: NotificationService,
    public localization: LocalizationService,
    private config: ConfigService
  ) {}

  getSettings() {
    return this.config.getAll()
  }

  setNotifSettings(notificationSettings) {
    return this.config.setNotificationSettings(notificationSettings)
  }

  setReportSettings(reportSettings) {
    return this.config.setReportSettings(reportSettings)
  }

  generateTestNotif() {
    return this.notifications.sendTestNotification()
  }

  reset() {
    return this.config.reset()
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
