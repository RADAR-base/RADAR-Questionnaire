import { Injectable } from '@angular/core'

import { ConfigService } from '../../../core/services/config/config.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'

@Injectable()
export class SettingsService {
  constructor(
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
    return this.config.sendTestNotification()
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
    const lang = JSON.parse(langValue)
    return this.localization
      .setLanguage(lang)
      .then(() => this.config.updateConfigStateOnLanguageChange())
  }

  sendCachedData() {
    return this.config.sendCachedData()
  }
}
