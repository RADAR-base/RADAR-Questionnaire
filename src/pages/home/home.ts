import { Component } from '@angular/core'
import { Storage } from '@ionic/storage'
import { NavController, AlertController } from 'ionic-angular'
import { TaskSelectPage } from '../taskselect/taskselect'
import { StartPage } from '../start/start'
import { SettingsPage } from '../settings/settings'


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'

})
export class HomePage {

  isOpenPageClicked: Boolean = false
  date: Date

  // TODO: replace with actual values
  checkmarks = ["1","2","3","4","5"]
  circles = ["6","7","8","9"]
  countCheckmarks = 5
  countTotal = 9

  constructor (
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private storage: Storage,
    ) {}

  ionViewDidLoad () {
  }

  ionViewDidEnter () {

  }

  handleOpenPage () {
    this.isOpenPageClicked = true
    this.openPage()
  }

  handleError (error) {
    console.error(error)
  }

  serviceReady () {
    if (this.isOpenPageClicked) {
      this.openPage()
    }
  }

  openSettingsPage () {
    this.navCtrl.push(SettingsPage)
  }

  openPage () {
    if (this.countTasks() > 1) {
      this.navCtrl.push(TaskSelectPage)
    }
    else {
      this.navCtrl.push(StartPage)
    }
  }

  countTasks () {
    // TODO: identify how many tasks are currently available
    return 3
  }

  showCredits () {
    let buttons = [
      {
        text: 'Okay',
        handler: () => {
          console.log('Okay clicked');
        }
      }
    ]
    this.showAlert({
      'title': 'Credits',
      'message': 'The RADAR-CNS Questionnaire app was developed by the RADAR-CNS consortium. For more information click <a href="http://radar-cns.org">here</a>.',
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
