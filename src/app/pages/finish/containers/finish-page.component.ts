import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { FirebaseAnalyticsService } from '../../../core/services/usage/firebaseAnalytics.service'
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
    private finish: FinishTaskService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {}

  ionViewDidLoad() {
    this.firebaseAnalytics.setCurrentScreen('finish-page')
    this.init()
    this.onComplete().then(() => this.showDone())
  }

  init() {
    this.questionnaireData = this.navParams.data
    this.task = this.navParams.data.task
    this.content = this.questionnaireData.endText
    this.isClinicalTask = this.task.isClinical !== false
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
    this.firebaseAnalytics.logEvent('questionnaire_finished', {
      questionnaire_timestamp: String(this.task.timestamp),
      type: this.task.name
    })
    setTimeout(() => (this.showDoneButton = true), 15000)
  }

  onComplete() {
    this.finish.updateTaskToComplete(this.task)
    return Promise.all([
      this.finish.sendCompletedEvent(),
      !this.task.name.includes('DEMO')
        ? this.finish.processDataAndSend(this.questionnaireData, this.task)
        : Promise.resolve()
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
