import { Component } from '@angular/core'
import { SchedulingService } from '../../providers/scheduling-service'
import { Task } from '../../models/task'
import { NavController, AlertController } from 'ionic-angular'
import { TaskSelectPage } from '../taskselect/taskselect'
import { StartPage } from '../start/start'
import { SettingsPage } from '../settings/settings'
import { DefaultTask } from '../../assets/data/defaultConfig'


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'

})
export class HomePage {

  isOpenPageClicked: Boolean = false
  nextTask: Task = DefaultTask

  constructor (
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private schedule: SchedulingService,
    ) {}

  ionViewDidLoad () {
    this.schedule.getNext().then((data) => {
      this.nextTask = data
    })
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
    this.navCtrl.push(TaskSelectPage)
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
