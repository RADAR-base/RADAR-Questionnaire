import {
  DefaultSettingsNotifications,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { NavController, Platform } from 'ionic-angular'

import { AlertService } from '../../../core/services/misc/alert.service'
import { Component } from '@angular/core'
import { FirebaseAnalyticsService } from '../../../core/services/usage/firebaseAnalytics.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { Settings } from '../../../shared/models/settings'
import { SettingsService } from '../services/settings.service'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings-page.component.html'
})
export class SettingsPageComponent {
  settings: Settings = {}
  notificationSettings = DefaultSettingsNotifications
  weeklyReport = DefaultSettingsWeeklyReport
  showLoading = false

  constructor(
    public navCtrl: NavController,
    public alertService: AlertService,
    public localization: LocalizationService,
    private platform: Platform,
    private settingsService: SettingsService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {}

  ionViewWillEnter() {
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
    this.navCtrl.pop()
  }

  backToSplash() {
    this.navCtrl.setRoot(SplashPageComponent)
  }

  notificationChange() {
    this.settingsService.setNotifSettings(this.notificationSettings)
  }

  weeklyReportChange(index) {
    this.weeklyReport[index].show = !this.weeklyReport[index].show
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
          return this.settingsService.reset().then(() => this.backToSplash())
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

  showGenerateTestNotification() {
    this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.TESTING_NOTIFICATIONS),
      message: this.localization.translateKey(
        LocKeys.TESTING_NOTIFICATIONS_MESSAGE
      ),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_CANCEL),
          handler: () => {}
        },
        {
          text: this.localization.translateKey(LocKeys.CLOSE_APP),
          handler: () => {
            this.firebaseAnalytics.logEvent('notification_test', {})
            this.settingsService.generateTestNotif()
            // NOTE: iOS does not support exitApp()
            if (this.platform.is('android')) this.platform.exitApp()
          }
        }
      ]
    })
  }
}
