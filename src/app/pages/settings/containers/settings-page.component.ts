import { Component } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version'
import { NavController, NavParams, Platform } from 'ionic-angular'

import {
  DefaultSettingsNotifications,
  DefaultSettingsSelectedLanguage,
  DefaultSettingsWeeklyReport,
  LanguageMap,
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config.service'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  LanguageSetting,
  NotificationSettings,
  WeeklyReportSubSettings,
} from '../../../shared/models/settings'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { AlertService } from '../../../core/services/alert.service'
import { LocalizationService } from '../../../core/services/localization.service'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings-page.component.html'
})
export class SettingsPageComponent {
  appVersionStr: string
  configVersion: string
  scheduleVersion: string
  cacheSize: number
  participantId: string
  projectName: string
  enrolmentDate: Date
  language: LanguageSetting = DefaultSettingsSelectedLanguage
  languagesSelectable: LanguageSetting[]
  notifications: NotificationSettings = DefaultSettingsNotifications
  weeklyReport: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  showLoading = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertService: AlertService,
    public storage: StorageService,
    private appVersion: AppVersion,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private notificationService: NotificationService,
    public localization: LocalizationService,
    private platform: Platform
  ) {}

  ionViewDidLoad() {
    this.loadSettings()

    this.storage.get(StorageKeys.REFERENCEDATE).then(refDate => {
      const createdDateMidnight = this.schedule.setDateTimeToMidnight(
        new Date(refDate)
      )
      this.storage.set(StorageKeys.REFERENCEDATE, createdDateMidnight.getTime())
    })
  }

  loadSettings() {
    return Promise.all([
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.SCHEDULE_VERSION),
      this.storage.get(StorageKeys.PARTICIPANTID),
      this.storage.get(StorageKeys.PROJECTNAME),
      this.storage.get(StorageKeys.ENROLMENTDATE),
      this.storage.get(StorageKeys.LANGUAGE),
      this.storage.get(StorageKeys.SETTINGS_NOTIFICATIONS),
      this.storage.get(StorageKeys.SETTINGS_LANGUAGES),
      this.storage.get(StorageKeys.SETTINGS_WEEKLYREPORT),
      this.storage.get(StorageKeys.CACHE_ANSWERS),
      this.appVersion.getVersionNumber(),
    ]).then(([
      configVersion,
      scheduleVersion,
      participantId,
      projectName,
      enrolmentDate,
      language,
      settingsNotification,
      settingsLanguages,
      settingsWeeklyReport,
      cache,
      appVersionPromise
    ]) => {
      this.appVersionStr = appVersionPromise
      this.configVersion = configVersion
      this.scheduleVersion = scheduleVersion
      this.participantId = participantId
      this.projectName = projectName
      this.enrolmentDate = enrolmentDate
      this.language = language
      this.notifications = settingsNotification
      this.languagesSelectable = settingsLanguages
      this.weeklyReport = settingsWeeklyReport
      this.cacheSize = Object.keys(cache).reduce((size, k) => k ? size + 1 : size, 0)
    })
  }

  backToHome() {
    this.navCtrl.pop()
  }

  backToSplash() {
    this.navCtrl.setRoot(SplashPageComponent)
  }

  notificationChange() {
    this.storage.set(StorageKeys.SETTINGS_NOTIFICATIONS, this.notifications)
  }

  weeklyReportChange(index) {
    this.weeklyReport[index].show = !this.weeklyReport[index].show
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.weeklyReport)
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
          const lang: LanguageSetting = {
            label: LanguageMap[selectedLanguageVal],
            value: selectedLanguageVal
          }
          this.language = lang
          this.storage.set(StorageKeys.LANGUAGE, lang).then(() =>
            this.localization.update().then(() => {
              this.showLoading = true
              return this.configService
                .updateConfigStateOnLanguageChange()
                .then(() => this.backToSplash())
            })
          )
        }
      }
    ]
    const inputs =  this.languagesSelectable.map(lang => ({
      type: 'radio',
      label: this.localization.translate(lang.label),
      value: lang.value,
      checked: lang.value === this.language.value,
    }))
    return this.alertService.showAlert({
      title: this.localization.translateKey(
        LocKeys.SETTINGS_LANGUAGE_ALERT
      ),
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

  consoleLogNotifications() {
    this.notificationService.consoleLogScheduledNotifications()
  }

  testNotifications() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_CANCEL),
        handler: () => {}
      },
      {
        text: this.localization.translateKey(LocKeys.CLOSE_APP),
        handler: () => {
          this.notificationService.testFCMNotifications()
          this.platform.exitApp()
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.TESTING_NOTIFICATIONS),
      message: this.localization.translateKey(
        LocKeys.TESTING_NOTIFICATIONS_MESSAGE
      ),
      buttons: buttons
    })
  }

  consoleLogSchedule() {
    console.log('SCHEDULE SETTINGS')
    this.schedule.consoleLogSchedule()
  }

  showConfirmReset() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_DISAGREE),
        handler: () => {
          console.log('Reset cancel')
        }
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_AGREE),
        handler: () => {
          this.storage.clearStorage().then(() => this.backToSplash())
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

  reloadConfig() {
    this.showLoading = true
    return this.configService
      .fetchConfigState(true)
      .then(() => {
        this.showLoading = false
        return this.loadSettings()
      })
      .catch(e => {
        this.alertService.showAlert({
          title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
          buttons: [
            {
              text: this.localization.translateKey(LocKeys.BTN_CANCEL),
              handler: () => {},
            },
            {
              text: this.localization.translateKey(LocKeys.BTN_RETRY),
              handler: () => { this.reloadConfig() },
            },
          ],
        })
        return Promise.reject(e)
      })
      .then(() => this.backToSplash())
  }
}
