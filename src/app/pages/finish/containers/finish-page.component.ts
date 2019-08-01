import { NavController, NavParams } from 'ionic-angular'

import { Assessment } from '../../../shared/models/assessment'
import { Component } from '@angular/core'
import { FinishTaskService } from '../services/finish-task.service'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { Task } from '../../../shared/models/task'
import { UsageEventType } from '../../../shared/enums/events'
import { UsageService } from '../../../core/services/usage/usage.service'

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
  task: Task
  questionnaireData
  assessment: Assessment

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private finish: FinishTaskService,
    private usage: UsageService
  ) {}

  ionViewDidLoad() {
    this.usage.setPage(this.constructor.name)
    this.init()
    this.onComplete().then(() => this.showDone())
  }

  init() {
    this.questionnaireData = this.navParams.data
    this.task = this.questionnaireData.task
    this.assessment = this.questionnaireData.assessment
    this.content = this.questionnaireData.endText
    this.isClinicalTask = this.task.isClinical !== false
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
    setTimeout(() => (this.showDoneButton = true), 15000)
  }

  onComplete() {
    this.finish.updateTaskToComplete(this.task)
    return Promise.all([
      this.usage.sendQuestionnaireEvent(
        UsageEventType.QUESTIONNAIRE_FINISHED,
        this.task
      ),
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
      ? this.finish.evalClinicalFollowUpTask(this.assessment)
      : Promise.resolve()
    res.then(() => {
      this.showDoneButton = false
      return this.navCtrl.setRoot(HomePageComponent)
    })
  }
}
