import { Component, trigger, state, style, transition, animate, keyframes, ViewChild, ElementRef} from '@angular/core'
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

  @ViewChild('progressBar')
  elProgress: ElementRef;
  elProgressHeight: number
  @ViewChild('tickerBar')
  elTicker: ElementRef;
  @ViewChild('taskInfo')
  elInfo: ElementRef;

  isOpenPageClicked: boolean = false
  nextTask: Task = DefaultTask
  showCalendar: boolean = false

  constructor (
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private schedule: SchedulingService,
    ) {}

  ionViewDidLoad () {
    this.schedule.getNextTask().then((data) => {
      this.nextTask = data
    })
  }


  displayCalendar (requestDisplay:boolean) {
    this.elProgressHeight= this.elProgress.nativeElement.offsetHeight
    this.showCalendar = requestDisplay
    this.applyTransformations()
  }

  applyTransformations () {
    if(this.showCalendar){
      this.elProgress.nativeElement.style.transform =
        `translateY(-${this.elProgressHeight}px) scale(0.5)`
      this.elTicker.nativeElement.style.transform =
        `translateY(-${this.elProgressHeight}px)`
        this.elInfo.nativeElement.style.transform =
          `translateY(-${this.elProgressHeight}px)`
    } else {
      this.elProgress.nativeElement.style.transform =
        `translateY(0px) scale(1)`
      this.elTicker.nativeElement.style.transform =
        `translateY(0px)`
        this.elInfo.nativeElement.style.transform =
          `translateY(0px)`
    }
  }



  openSettingsPage () {
    this.navCtrl.push(SettingsPage)
  }

  openTaskSelectPage () {
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
