import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular'
import { StorageService } from '../../providers/storage-service'
import { NotificationSettings } from '../../models/settings'
import { WeeklyReportSubSettings } from '../../models/settings'
import { DefaultSettingsNotifications } from '../../assets/data/defaultConfig'
import { DefaultSettingsWeeklyReport } from '../../assets/data/defaultConfig'
import { StorageKeys } from '../../enums/storage'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})

export class SettingsPage {

  configVersion: String
  scheduleVersion: String
  patientId: String
  referenceDate: Date
  language: String
  languagesSelectable: String[]
  notifications: NotificationSettings = DefaultSettingsNotifications
  weeklyReport: WeeklyReportSubSettings[] = DefaultSettingsWeeklyReport


  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private storage: StorageService) {
  }

  ionViewDidLoad() {
    this.loadSettings()
  }

  loadSettings() {
    this.storage.get(StorageKeys.CONFIG_VERSION).then((configVersion) => {
      this.configVersion = configVersion
    })
    this.storage.get(StorageKeys.SCHEDULE_VERSION).then((scheduleVersion) => {
      this.scheduleVersion = scheduleVersion
    })
    this.storage.get(StorageKeys.PATIENTID).then((patientId) => {
      this.patientId = patientId
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
        text: 'Cancel',
        handler: () => {
        }
      },
      {
        text: 'Set',
        handler: (selectedLanguage) => {
          this.storage.set(StorageKeys.LANGUAGE, selectedLanguage)
          this.language = selectedLanguage
        }
      }
    ]
    var inputs = []
    for(var i=0; i<this.languagesSelectable.length; i++){
      var checked = false
      if(this.languagesSelectable[i] == this.language) {
        checked = true
      }
      inputs.push({
        type: 'radio',
        label: this.languagesSelectable[i],
        value: this.languagesSelectable[i],
        checked: checked
      })
    }
    this.showAlert({
      'title': 'Select your Language',
      'buttons': buttons,
      'inputs': inputs
    })
  }

  showInfoNightMode() {
    let buttons = [
      {
        text: 'Okay',
        handler: () => {}
      }
    ]
    this.showAlert({
      'title': 'Night Mode',
      'message': 'Night Mode suppresses all notifications between 10pm and 7:30am.',
      'buttons': buttons
    })
  }

  showConfirmReset() {
    let buttons = [
      {
        text: 'Disagree',
        handler: () => {
          console.log('Reset cancel')
        }
      },
      {
        text: 'Agree',
        handler: () => {
          this.storage.clearStorage()
          this.backToHome()
        }
      }
    ]
    this.showAlert({
      'title': 'Reset RADAR-CNS App',
      'message': 'All saved information will be lost.',
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

}
