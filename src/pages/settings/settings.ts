import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';
import { AlertController } from 'ionic-angular';
import { StorageService } from '../../providers/storage-service';
import { SchedulingService } from '../../providers/scheduling-service';
import { HomeController } from '../../providers/home-controller';
import { ConfigService } from '../../providers/config-service';
import { LanguageSetting } from '../../models/settings';
import { NotificationSettings } from '../../models/settings';
import { WeeklyReportSubSettings } from '../../models/settings';
import { DefaultSettingsNotifications } from '../../assets/data/defaultConfig';
import { DefaultSettingsWeeklyReport } from '../../assets/data/defaultConfig';
import { DefaultSettingsSelectedLanguage, LanguageMap } from '../../assets/data/defaultConfig';
import { StorageKeys } from '../../enums/storage';
import { LocKeys } from '../../enums/localisations';
import { TranslatePipe } from '../../pipes/translate/translate';
import { SplashPage } from '../splash/splash';
import { DefaultNumberOfNotificationsToSchedule } from '../../assets/data/defaultConfig';


@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
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
  showLoading: boolean = false

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public storage: StorageService,
    private appVersion: AppVersion,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private controller: HomeController,
    public translate: TranslatePipe){
    }

  ionViewDidLoad() {
    this.loadSettings()

    this.storage.get(StorageKeys.REFERENCEDATE)
    .then((refDate) => {
      let createdDateMidnight = this.schedule.setDateTimeToMidnight(new Date(refDate))
      this.storage.set(StorageKeys.REFERENCEDATE, createdDateMidnight.getTime())
    })
  }

  loadSettings() {
    let appVersionPromise = this.appVersion.getVersionNumber()
    let configVersion = this.storage.get(StorageKeys.CONFIG_VERSION)
    let scheduleVersion = this.storage.get(StorageKeys.SCHEDULE_VERSION)
    let participantId = this.storage.get(StorageKeys.PARTICIPANTID)
    let projectName = this.storage.get(StorageKeys.PROJECTNAME)
    let enrolmentDate = this.storage.get(StorageKeys.ENROLMENTDATE)
    let language = this.storage.get(StorageKeys.LANGUAGE)
    let settingsNotification = this.storage.get(StorageKeys.SETTINGS_NOTIFICATIONS)
    let settingsLanguages = this.storage.get(StorageKeys.SETTINGS_LANGUAGES)
    let settingsWeeklyReport = this.storage.get(StorageKeys.SETTINGS_WEEKLYREPORT)
    let cache = this.storage.get(StorageKeys.CACHE_ANSWERS)
    let settings = [configVersion, scheduleVersion, participantId, projectName,
      enrolmentDate, language, settingsNotification, settingsLanguages, settingsWeeklyReport,
      cache, appVersionPromise]
    Promise.all(settings).then((returns) => {
      this.appVersionStr       = returns[10]
      this.configVersion       = returns[0]
      this.scheduleVersion     = returns[1]
      this.participantId       = returns[2]
      this.projectName         = returns[3]
      this.enrolmentDate       = returns[4]
      this.language            = returns[5]
      this.notifications       = returns[6]
      this.languagesSelectable = returns[7]
      this.weeklyReport        = returns[8]
      var size = 0
      for(var key in returns[9]) {
        size += 1
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
    this.weeklyReport[index].show != this.weeklyReport[index].show
    this.storage.set(StorageKeys.SETTINGS_WEEKLYREPORT, this.weeklyReport)
  }

  showSelectLanguage() {
    let buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_CANCEL.toString()),
        handler: () => {
        }
      },
      {
        text: this.translate.transform(LocKeys.BTN_SET.toString()),
        handler: (selectedLanguageVal) => {
          let lang: LanguageSetting = {
            "label": LanguageMap[selectedLanguageVal],
            "value": selectedLanguageVal
          }
          this.storage.set(StorageKeys.LANGUAGE, lang)
          .then(() => {
            this.configService.pullQuestionnaires(StorageKeys.CONFIG_ASSESSMENTS)
            this.configService.pullQuestionnaires(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
          })
          this.language = lang
          this.navCtrl.setRoot(SplashPage)
        }
      }
    ]
    var inputs = []
    for(var i=0; i<this.languagesSelectable.length; i++){
      var checked = false
      if(this.languagesSelectable[i]["label"] == this.language) {
        checked = true
      }
      inputs.push({
        type: 'radio',
        label: this.translate.transform(this.languagesSelectable[i]["label"]),
        value: this.languagesSelectable[i]["value"],
        checked: checked
      })
    }
    this.showAlert({
      'title': this.translate.transform(LocKeys.SETTINGS_LANGUAGE_ALERT.toString()),
      'buttons': buttons,
      'inputs': inputs
    })
  }

  showInfoNightMode() {
    let buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {}
      }
    ]
    this.showAlert({
      'title': this.translate.transform(LocKeys.SETTINGS_NOTIFICATIONS_NIGHTMOD.toString()),
      'message': this.translate.transform(LocKeys.SETTINGS_NOTIFICATIONS_NIGHTMOD_DESC.toString()),
      'buttons': buttons
    })
  }

  consoleLogNotifications() {
    this.controller.consoleLogNotifications();
  }

  consoleLogSchedule() {
    console.log('SCHEDULE SETTINGS')
    this.controller.consoleLogSchedule();
  }

  showConfirmReset() {
    let buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_DISAGREE.toString()),
        handler: () => {
          console.log('Reset cancel')
        }
      },
      {
        text: this.translate.transform(LocKeys.BTN_AGREE.toString()),
        handler: () => {
          this.storage.clearStorage()
            .then(() => this.backToSplash())
        }
      }
    ]
    this.showAlert({
      'title': this.translate.transform(LocKeys.SETTINGS_RESET_ALERT.toString()),
      'message': this.translate.transform(LocKeys.SETTINGS_RESET_ALERT_DESC.toString()),
      'buttons': buttons
    })
  }

  showAlert(parameters) {
    let alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if(parameters.message) {
      alert.setMessage(parameters.message)
    }
    if(parameters.inputs) {
      for(var i=0; i<parameters.inputs.length; i++){
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }

  reloadConfig() {
    this.showLoading = true
    this.configService.fetchConfigState()
     .then(() => {
       this.loadSettings()
       // First cancel and then reschedule notifications
       this.controller.cancelNotifications()
         .then(() => {
         this.controller.setNextXNotifications(DefaultNumberOfNotificationsToSchedule)
         .then(() => {
           this.showLoading = false
         })
       })
     })
  }

}
