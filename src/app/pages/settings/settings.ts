import { Component } from '@angular/core'
import { AppVersion } from '@ionic-native/app-version'
import {
  AlertController,
  IonicPage,
  NavController,
  NavParams
} from 'ionic-angular'

import {
  DefaultNumberOfNotificationsToSchedule,
  DefaultSettingsNotifications,
  DefaultSettingsSelectedLanguage,
  DefaultSettingsWeeklyReport,
  LanguageMap
} from '../../../assets/data/defaultConfig'
import { ConfigService } from '../../core/services/config.service'
import { HomeController } from '../../core/services/home-controller.service'
import { SchedulingService } from '../../core/services/scheduling.service'
import { StorageService } from '../../core/services/storage.service'
import { LocKeys } from '../../shared/enums/localisations'
import { StorageKeys } from '../../shared/enums/storage'
import {
  LanguageSetting,
  NotificationSettings,
  WeeklyReportSubSettings
} from '../../shared/models/settings'
import { TranslatePipe } from '../../shared/pipes/translate/translate'
import { SplashPage } from '../splash/splash'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  appVersionStr: String
  configVersion: String
  scheduleVersion: String
  cacheSize: number
  participantId: String
  projectName: String
  enrolmentDate: Date
  language: LanguageSetting = DefaultSettingsSelectedLanguage
  languagesSelectable: String[]
  notifications: NotificationSettings = DefaultSettingsNotifications
  weeklyReport: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  showLoading = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public storage: StorageService,
    private appVersion: AppVersion,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private controller: HomeController,
    public translate: TranslatePipe
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
    const appVersionPromise = this.appVersion.getVersionNumber()
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
      appVersionPromise
    ]
    Promise.all(settings).then(returns => {
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
    this.navCtrl.setRoot(SplashPage)
  }

  notificationChange() {
    this.storage.set(StorageKeys.SETTINGS_NOTIFICATIONS, this.notifications)
  }

  weeklyReportChange(index) {
    // this.weeklyReport[index].show !== this.weeklyReport[index].show
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
          this.storage.set(StorageKeys.LANGUAGE, lang).then(() => {
            this.configService.pullQuestionnaires(
              StorageKeys.CONFIG_ASSESSMENTS
            )
            this.configService.pullQuestionnaires(
              StorageKeys.CONFIG_CLINICAL_ASSESSMENTS
            )
          })
          this.language = lang
          this.navCtrl.setRoot(SplashPage)
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
    this.showAlert({
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
    this.showAlert({
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
    this.controller.consoleLogNotifications()
  }

  consoleLogSchedule() {
    console.log('SCHEDULE SETTINGS')
    this.controller.consoleLogSchedule()
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
          this.storage.clearStorage().then(() => this.backToSplash())
        }
      }
    ]
    this.showAlert({
      title: this.translate.transform(LocKeys.SETTINGS_RESET_ALERT.toString()),
      message: this.translate.transform(
        LocKeys.SETTINGS_RESET_ALERT_DESC.toString()
      ),
      buttons: buttons
    })
  }

  showAlert(parameters) {
    const alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if (parameters.message) {
      alert.setMessage(parameters.message)
    }
    if (parameters.inputs) {
      for (let i = 0; i < parameters.inputs.length; i++) {
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }

  reloadConfig() {
    this.showLoading = true
    this.configService.fetchConfigState(true).then(() => {
      this.loadSettings()
      this.controller
        .setNextXNotifications(DefaultNumberOfNotificationsToSchedule)
        .then(() => {
          this.showLoading = false
        })
    })
  }
}
