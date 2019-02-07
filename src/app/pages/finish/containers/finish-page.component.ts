import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { HomePageComponent } from '../../home/containers/home-page.component'
import { FinishTaskService } from '../services/finish-task.service'

@Component({
  selector: 'page-finish',
  templateUrl: 'finish-page.component.html'
})
export class FinishPageComponent {
  content = ''
  isClinicalTask = false
  completedInClinic = false
  displayNextTaskReminder = true
  showDoneButton = false
  task
  questionnaireData

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private finish: FinishTaskService
  ) {}

  ionViewDidLoad() {
    this.init()
    this.onComplete().then(() => this.showDone())
  }

  init() {
    this.questionnaireData = this.navParams.data
    this.task = this.navParams.data.task
    this.content = this.questionnaireData.endText
    this.isClinicalTask = this.task.isClinical
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
  }

  onComplete() {
    return Promise.all([
      this.finish.sendCompletedEvent(),
      this.finish.updateTaskToComplete(this.task),
      this.finish.processDataAndSend(this.questionnaireData, this.task)
    ])
  }

  showDone() {
    this.showDoneButton = true
  }

  handleClosePage() {
    const res = this.completedInClinic
      ? this.finish.evalClinicalFollowUpTask(this.task)
      : Promise.resolve()
    res.then(() => {
      this.showDoneButton = false
      return this.navCtrl.setRoot(HomePageComponent)
    })
  }
}
