import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular'
import { Storage } from '@ionic/storage'
import { NotificationSettings } from '../../models/settings'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  patientId: String
  referenceDate: Date
  language: String
  languagesSelectable: String[] = ['English','Italian','Spanish','Dutch','German']
  notifications: NotificationSettings


  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private storage: Storage) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Settings');
    this.loadSettings()
  }

  loadSettings() {
    this.storage.get('patientId').then((patientId) => {
      this.patientId = patientId
    })
    this.storage.get('referenceDate').then((referenceDate) => {
      this.referenceDate = referenceDate
    })
    this.storage.get('language').then((language) => {
      this.language = language
    })
    this.storage.get('notificationSettings').then((notificationSettings) => {
      this.notifications = notificationSettings
      console.log(this.notifications)
    })
  }


  backToHome() {
    console.log("Go back to home")
  }

  showSelectLanguage() {
    let buttons = [
      {
        text: 'Cancel',
        handler: () => {
          console.log('Language cancel')
        }
      },
      {
        text: 'Set',
        handler: (selectedLanguage) => {
          console.log('Language set');
          this.storage.set('language', selectedLanguage)
          this.loadSettings()
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
        handler: () => {
          console.log('Okay clicked');
        }
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
          console.log('Reset confirmed')
          this.storage.clear()
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
