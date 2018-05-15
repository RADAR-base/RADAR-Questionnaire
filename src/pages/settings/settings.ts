import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { StorageService } from '../../providers/storage-service';
import { SchedulingService } from '../../providers/scheduling-service'
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
import { MyApp } from '../../app/app.component';


@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})

export class SettingsPage {

  configVersion: String
  scheduleVersion: String
  cacheSize: number
  participantId: String
  projectName: String
  referenceDate: Date
  language: LanguageSetting = DefaultSettingsSelectedLanguage
  languagesSelectable: String[]
  notifications: NotificationSettings = DefaultSettingsNotifications
  weeklyReport: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport
  showLoading: boolean = false

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private storage: StorageService,
    private schedule: SchedulingService,
    private configService: ConfigService,
    private translate: TranslatePipe){
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
    this.storage.get(StorageKeys.CONFIG_VERSION).then((configVersion) => {
      this.configVersion = configVersion
    })
    this.storage.get(StorageKeys.SCHEDULE_VERSION).then((scheduleVersion) => {
      this.scheduleVersion = scheduleVersion
    })
    this.storage.get(StorageKeys.PARTICIPANTID).then((participantId) => {
      this.participantId = participantId
    })
    this.storage.get(StorageKeys.PROJECTNAME).then((projectName) => {
      this.projectName = projectName
    })
    this.storage.get(StorageKeys.REFERENCEDATE).then((referenceDate) => {
      this.referenceDate = referenceDate
    })
    this.storage.get(StorageKeys.LANGUAGE).then((language) => {
      this.language = language
    })
    this.storage.get(StorageKeys.SETTINGS_NOTIFICATIONS).then((settingsNotifications) => {
      this.notifications = settingsNotifications
    })
    this.storage.get(StorageKeys.SETTINGS_LANGUAGES).then((settingsLanguages) => {
      this.languagesSelectable = settingsLanguages
    })
    this.storage.get(StorageKeys.SETTINGS_WEEKLYREPORT).then((settingsWeeklyReport) => {
      this.weeklyReport = settingsWeeklyReport
    })
    this.storage.get(StorageKeys.CACHE_ANSWERS).then((cache) => {
      var size = 0
      for(var key in cache) {
        size += 1
      }
      this.cacheSize = size
    })

  }


  backToHome() {
    this.navCtrl.pop()
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
          this.navCtrl.setRoot(MyApp)
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
          this.backToHome()
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
       this.showLoading = false
       this.loadSettings()
     })
  }

}
