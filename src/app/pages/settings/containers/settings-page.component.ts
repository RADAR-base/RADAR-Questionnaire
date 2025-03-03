import { Component } from '@angular/core'
import { Router } from '@angular/router'
import {
  IonicModule,
  LoadingController,
  ModalController,
  NavController
} from '@ionic/angular'
import { AlertInput } from '@ionic/core'

import {
  DefaultSettingsNotifications,
  DefaultSettingsWeeklyReport
} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { ResetOption } from '../../../shared/models/reset-options'
import { Settings } from '../../../shared/models/settings'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { CacheSendModalComponent } from '../components/cache-send-modal/cache-send-modal.component'
import { SettingsService } from '../services/settings.service'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
import { MomentModule } from 'ngx-moment'
import { NgIf } from '@angular/common'
import { addIcons } from 'ionicons'
import { caretDownOutline, repeat } from 'ionicons/icons'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings-page.component.html',
  styleUrls: ['settings-page.component.scss'],
  imports: [IonicModule, TranslatePipe, MomentModule, NgIf]
})
export class SettingsPageComponent {
  settings: Settings = {}
  notificationSettings = DefaultSettingsNotifications
  weeklyReport = DefaultSettingsWeeklyReport
  showLoading = false
  daysSinceEnrolment = 0

  RESET_OPTION_MESSAGES = {
    [ResetOption.ENROLMENT]: LocKeys.SETTINGS_RESET_ALERT_ENROLMENT_DESC,
    [ResetOption.CACHE]: LocKeys.SETTINGS_RESET_ALERT_CACHE_DESC,
    [ResetOption.CONFIG]: LocKeys.SETTINGS_RESET_ALERT_CONFIG_DESC
  }
  RESET_OPTIONS = {
    [ResetOption.ENROLMENT]: LocKeys.SETTINGS_ENROLMENT,
    [ResetOption.CACHE]: LocKeys.SETTINGS_CACHE,
    [ResetOption.CONFIG]: LocKeys.SETTINGS_CONFIGURATION
  }

  constructor(
    public navCtrl: NavController,
    public loadCtrl: LoadingController,
    public alertService: AlertService,
    public localization: LocalizationService,
    private settingsService: SettingsService,
    private usage: UsageService,
    public modalCtrl: ModalController,
    private router: Router
  ) {
    addIcons({caretDownOutline, repeat})
  }

  ionViewWillEnter() {
    this.usage.setPage(this.constructor.name)
    this.loadSettings()
  }

  loadSettings() {
    return Promise.all(
      Object.entries(this.settingsService.getSettings()).map(
        ([k, v]: [string, Promise<any>]) =>
          v.then(val => (this.settings[k] = val))
      )
    ).then(() => {
      this.daysSinceEnrolment = this.getDaysSinceEnrolment()
    })
  }

  getDaysSinceEnrolment() {
    const now = this.localization.moment(Date.now())
    const enrolment = this.localization.moment(this.settings.enrolmentDate)
    return now.diff(enrolment, 'days')
  }

  reloadConfig() {
    this.showLoading = true
    return this.settingsService
      .reloadConfig()
      .then(() => this.loadSettings())
      .then(() => this.backToSplash())
      .catch(e => this.showFailAlert(e))
      .then(() => (this.showLoading = false))
  }

  backToHome() {
    this.navCtrl.navigateBack('/home')
  }

  backToSplash() {
    this.navCtrl.navigateRoot('')
  }

  notificationChange() {
    this.settingsService.setNotifSettings(this.notificationSettings)
  }

  weeklyReportChange(index) {
    this.settingsService.setReportSettings(this.weeklyReport)
  }

  showFailAlert(e) {
    return this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.STATUS_FAILURE),
      message: e,
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
            .catch(e => this.showFailAlert(e))
        }
      }
    ]
    const inputs = this.settings.languagesSelectable.map(
      lang =>
        ({
          type: 'radio',
          label: this.localization.translate(lang.label),
          value: JSON.stringify(lang),
          checked: lang.value === this.settings.language.value
        } as AlertInput)
    )
    return this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.SETTINGS_LANGUAGE_ALERT),
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
      header: this.localization.translateKey(
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
      header: this.localization.translateKey(LocKeys.SETTINGS_RESET_ALERT),
      message: this.localization.translateKey(
        LocKeys.SETTINGS_RESET_ALERT_DESC
      ),
      buttons: buttons
    })
  }

  showResetOptions() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_CANCEL),
        handler: () => {}
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_RESET),
        handler: selected => {
          const promises = []
          if (selected.includes(ResetOption.ENROLMENT))
            promises.push(this.settingsService.resetEnrolment())
          else if (selected.includes(ResetOption.CONFIG))
            promises.push(this.settingsService.resetConfig())
          else if (selected.includes(ResetOption.CACHE))
            promises.push(this.settingsService.resetCache())
          Promise.all(promises).then(() => this.backToSplash())
        }
      }
    ]
    const input = []
    for (const item in ResetOption) {
      if (item)
        input.push({
          type: 'checkbox',
          label: this.localization.translateKey(this.RESET_OPTIONS[item]),
          value: ResetOption[item],
          handler: d => {
            if (d.checked) this.showResetOptionConfirm(d)
          }
        })
    }
    return this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.SETTINGS_RESET_ALERT),
      message: this.localization.translateKey(
        LocKeys.SETTINGS_RESET_ALERT_OPTION_DESC
      ),
      buttons: buttons,
      inputs: input
    })
  }

  showResetOptionConfirm(option) {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_OKAY),
        handler: () => {}
      }
    ]
    return this.alertService.showAlert({
      message: this.localization.translateKey(
        this.RESET_OPTION_MESSAGES[option.value]
      ),
      buttons: buttons
    })
  }

  showGenerateTestNotification() {
    this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.TESTING_NOTIFICATIONS),
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

  async sendCachedData() {
    const loader = await this.loadCtrl.create({
      message: this.localization.translateKey(LocKeys.SETTINGS_WAIT_ALERT),
      cssClass: 'custom-loading'
    })
    loader.present()
    return this.settingsService.sendCachedData().then(async res => {
      await loader.dismiss()
      this.showResult(res)
      this.backToHome()
    })
  }

  async showResult(res) {
    const modal = await this.modalCtrl.create({
      component: CacheSendModalComponent,
      componentProps: {
        data: res
      }
    })
    return await modal.present()
  }
}
