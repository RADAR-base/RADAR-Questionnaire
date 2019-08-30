import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import {
  DefaultSettingsNotifications,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { Settings } from '../../../shared/models/settings'
import { SettingsService } from '../services/settings.service'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings-page.component.html'
})
export class SettingsPageComponent implements OnInit {
  settings: Settings = {}
  notificationSettings = DefaultSettingsNotifications
  weeklyReport = DefaultSettingsWeeklyReport
  showLoading = false

  constructor(
    public alertService: AlertService,
    public localization: LocalizationService,
    private settingsService: SettingsService,
    private usage: UsageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usage.setPage(this.constructor.name)
    this.loadSettings()
  }

  loadSettings() {
    Object.entries(this.settingsService.getSettings()).map(([k, v]) =>
      v.then(val => (this.settings[k] = val))
    )
  }

  reloadConfig() {
    this.showLoading = true
    return this.settingsService
      .reloadConfig()
      .then(() => this.loadSettings())
      .then(() => this.backToSplash())
      .catch(e => this.showFailAlert())
      .then(() => (this.showLoading = false))
  }

  backToHome() {
    this.router.navigate(['/home'])
  }

  backToSplash() {
    this.router.navigate([''])
  }

  notificationChange() {
    this.settingsService.setNotifSettings(this.notificationSettings)
  }

  weeklyReportChange(index) {
    this.settingsService.setReportSettings(this.weeklyReport)
  }

  showFailAlert() {
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_CANCEL),
          handler: () => {}
        },
        {
          text: this.localization.translateKey(LocKeys.BTN_RETRY),
          handler: () => {
            this.reloadConfig()
          }
        }
      ]
    })
  }

  showSelectLanguage() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_CANCEL),
        handler: () => {}
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_SET),
        handler: selectedLanguageVal => {
          this.settingsService
            .changeLanguage(selectedLanguageVal)
            .then(() => {
              this.settings.language = this.settingsService.getLanguage()
              return this.backToSplash()
            })
            .catch(e => this.showFailAlert())
        }
      }
    ]
    const inputs = this.settings.languagesSelectable.map(lang => ({
      type: 'radio',
      label: this.localization.translate(lang.label),
      value: lang.value,
      checked: lang.value === this.settings.language.value
    }))
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SETTINGS_LANGUAGE_ALERT),
      buttons: buttons,
      inputs: inputs
    })
  }

  showInfoNightMode() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_OKAY),
        handler: () => {}
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(
        LocKeys.SETTINGS_NOTIFICATIONS_NIGHTMOD
      ),
      message: this.localization.translateKey(
        LocKeys.SETTINGS_NOTIFICATIONS_NIGHTMOD_DESC
      ),
      buttons: buttons
    })
  }

  showConfirmReset() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_DISAGREE),
        handler: () => console.log('Reset cancel')
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_AGREE),
        handler: () => {
          return this.showResetOptions()
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SETTINGS_RESET_ALERT),
      message: this.localization.translateKey(
        LocKeys.SETTINGS_RESET_ALERT_DESC
      ),
      buttons: buttons
    })
  }

  showResetOptions() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_ENROL_ENROL),
        handler: () => {
          this.settingsService.resetAuth().then(() => this.backToSplash())
        }
      },
      {
        text: this.localization.translateKey(LocKeys.SETTINGS_CONFIGURATION),
        handler: () =>
          this.settingsService.reset().then(() => this.backToSplash())
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.SETTINGS_RESET_ALERT),
      message: this.localization.translateKey(
        LocKeys.SETTINGS_RESET_ALERT_OPTION_DESC
      ),
      buttons: buttons
    })
  }

  showGenerateTestNotification() {
    this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.TESTING_NOTIFICATIONS),
      message: this.localization.translateKey(
        LocKeys.TESTING_NOTIFICATIONS_MESSAGE
      ),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {
            this.settingsService.generateTestNotif()
          }
        }
      ]
    })
  }
}
