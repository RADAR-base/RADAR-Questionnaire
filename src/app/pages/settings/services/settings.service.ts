import { ConfigService } from '../../../core/services/config/config.service'
import { Injectable } from '@angular/core'
import { LanguageMap } from '../../../../assets/data/defaultConfig'
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
    return this.config.updateSettings(notificationSettings)
  }

  setReportSettings(reportSettings) {
    return this.config.updateSettings(reportSettings)
  }

  generateTestNotif() {
    return this.notifications.sendTestNotification()
  }

  resetAuth() {
    return this.config.resetAll()
  }

  reset() {
    return this.config.resetConfig()
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
