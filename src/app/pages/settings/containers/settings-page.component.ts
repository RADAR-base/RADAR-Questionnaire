import { Component } from '@angular/core'
import {
  AlertController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular'

import {
  DefaultSettingsNotifications,
  DefaultSettingsSelectedLanguage,
  DefaultSettingsWeeklyReport,
  LanguageMap
} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/alert.service'
import { ConfigService } from '../../../core/services/config.service'
import { FirebaseAnalyticsService } from '../../../core/services/firebaseAnalytics.service'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  LanguageSetting,
  NotificationSettings,
  WeeklyReportSubSettings
} from '../../../shared/models/settings'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings-page.component.html'
})
export class SettingsPageComponent {
  appVersionStr: String
  configVersion: String
  scheduleVersion: String
  cacheSize: number
  participantId: String
  projectName: String
  enrolmentDate: Date
  lastUploadDate: Date
  language: LanguageSetting = DefaultSettingsSelectedLanguage
  languagesSelectable: String[]
  notifications: NotificationSettings = DefaultSettingsNotifications
  weeklyReport: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  showLoading = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertService: AlertService,
    public storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private notificationService: NotificationService,
    public translate: TranslatePipe,
    private platform: Platform,
    private firebaseAnalytics: FirebaseAnalyticsService
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
    const appVersion = this.storage.get(StorageKeys.APP_VERSION)
    const configVersion = this.storage.get(StorageKeys.CONFIG_VERSION)
    const scheduleVersion = this.storage.get(StorageKeys.SCHEDULE_VERSION)
    const participantId = this.storage.get(StorageKeys.PARTICIPANTID)
    const projectName = this.storage.get(StorageKeys.PROJECTNAME)
    const enrolmentDate = this.storage.get(StorageKeys.ENROLMENTDATE)
    const language = this.storage.get(StorageKeys.LANGUAGE)
    const settingsNotification = this.storage.get(
      StorageKeys.SETTINGS_NOTIFICATIONS
    )
    const settingsLanguages = this.storage.get(StorageKeys.SETTINGS_LANGUAGES)
    const settingsWeeklyReport = this.storage.get(
      StorageKeys.SETTINGS_WEEKLYREPORT
    )
    const cache = this.storage.get(StorageKeys.CACHE_ANSWERS)
    const lastUpload = this.storage.get(StorageKeys.LAST_UPLOAD_DATE)
    const settings = [
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
      appVersion,
      lastUpload
    ]
    return Promise.all(settings).then(returns => {
      this.appVersionStr = returns[10]
      this.configVersion = returns[0]
      this.scheduleVersion = returns[1]
      this.participantId = returns[2]
      this.projectName = returns[3]
      this.enrolmentDate = returns[4]
      this.language = returns[5]
      this.notifications = returns[6]
      this.languagesSelectable = returns[7]
      this.weeklyReport = returns[8]
      this.lastUploadDate = returns[11]
      let size = 0
      for (const key in returns[9]) {
        if (key) {
          size += 1
        }
      }
      this.cacheSize = size
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
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {}
      },
      {
        text: this.translate.transform(LocKeys.BTN_SET.toString()),
        handler: selectedLanguageVal => {
          const lang: LanguageSetting = {
            label: LanguageMap[selectedLanguageVal],
            value: selectedLanguageVal
          }
          this.language = lang
          this.storage.set(StorageKeys.LANGUAGE, lang).then(() =>
            this.translate.init().then(() => {
              this.showLoading = true
              return this.configService
                .updateConfigStateOnLanguageChange()
                .then(() => this.backToSplash())
            })
          )
        }
      }
    ]
    const inputs = []
    for (let i = 0; i < this.languagesSelectable.length; i++) {
      let checked = false
      if (this.languagesSelectable[i]['label'] === this.language) {
        checked = true
      }
      inputs.push({
        type: 'radio',
        label: this.translate.transform(this.languagesSelectable[i]['label']),
        value: this.languagesSelectable[i]['value'],
        checked: checked
      })
    }
    return this.alertService.showAlert({
      title: this.translate.transform(
        LocKeys.SETTINGS_LANGUAGE_ALERT.toString()
      ),
      buttons: buttons,
      inputs: inputs
    })
  }

  showInfoNightMode() {
    const buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {}
      }
    ]
    return this.alertService.showAlert({
      title: this.translate.transform(
        LocKeys.SETTINGS_NOTIFICATIONS_NIGHTMOD.toString()
      ),
      message: this.translate.transform(
        LocKeys.SETTINGS_NOTIFICATIONS_NIGHTMOD_DESC.toString()
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
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {}
      },
      {
        text: this.translate.transform(LocKeys.CLOSE_APP.toString()),
        handler: () => {
          this.notificationService.sendTestFCMNotification().then(() => {
            this.firebaseAnalytics.logEvent('notification_test', {})
            this.platform.exitApp()
          })
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.translate.transform(LocKeys.TESTING_NOTIFICATIONS.toString()),
      message: this.translate.transform(
        LocKeys.TESTING_NOTIFICATIONS_MESSAGE.toString()
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
        text: this.translate.transform(LocKeys.BTN_DISAGREE.toString()),
        handler: () => {
          console.log('Reset cancel')
        }
      },
      {
        text: this.translate.transform(LocKeys.BTN_AGREE.toString()),
        handler: () => {
          this.firebaseAnalytics.logEvent('app_reset', {})
          this.storage.clearStorage().then(() => this.backToSplash())
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.translate.transform(LocKeys.SETTINGS_RESET_ALERT.toString()),
      message: this.translate.transform(
        LocKeys.SETTINGS_RESET_ALERT_DESC.toString()
      ),
      buttons: buttons
    })
  }

  reloadConfig() {
    this.showLoading = true
    return this.configService
      .fetchConfigState(true)
      .catch(e => this.showConfigError())
      .then(() => {
        this.showLoading = false
        return this.loadSettings()
      })
      .then(() => this.backToSplash())
  }

  showConfigError() {
    const buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {}
      },
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {
          this.reloadConfig()
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.translate.transform(LocKeys.STATUS_FAILURE.toString()),
      message: this.translate.transform(LocKeys.CONFIG_ERROR_DESC.toString()),
      buttons: buttons
    })
  }
}
