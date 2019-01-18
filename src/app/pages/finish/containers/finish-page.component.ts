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
  hasClickedDoneButton = false
  associatedTask
  questionnaireData

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private finish: FinishTaskService
  ) {}

  ionViewDidLoad() {
    this.init()
    this.onComplete()
  }

  init() {
    this.questionnaireData = this.navParams.data
    this.associatedTask = this.questionnaireData.associatedTask
    this.content = this.questionnaireData.endText
    this.isClinicalTask = this.associatedTask.isClinical
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
  }

  onComplete() {
    this.finish.sendCompletedEvent()
    this.finish.updateTaskToComplete(this.associatedTask)
    this.finish.processDataAndSend(this.questionnaireData, this.associatedTask)
  }

  handleClosePage() {
    const res = this.completedInClinic
      ? this.finish.evalClinicalFollowUpTask(this.associatedTask)
      : Promise.resolve()
    res.then(() => {
      this.hasClickedDoneButton = !this.hasClickedDoneButton
      return this.navCtrl.setRoot(HomePageComponent)
    })
  }
}
