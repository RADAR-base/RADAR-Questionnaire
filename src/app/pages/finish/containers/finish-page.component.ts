import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import {
  DefaultNumberOfNotificationsToSchedule,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationService } from '../../../core/services/notification.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { Task } from '../../../shared/models/task'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { FinishTaskService } from '../services/finish-task.service'
import { PrepareDataService } from '../services/prepare-data.service'

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
  associatedTask
  questionnaireData

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private kafkaService: KafkaService,
    private prepareDataService: PrepareDataService,
    private notificationService: NotificationService,
    private finishTaskService: FinishTaskService,
    public storage: StorageService
  ) {}

  ionViewDidLoad() {
    this.questionnaireData = this.navParams.data
    this.associatedTask = this.questionnaireData.associatedTask
    this.content = this.questionnaireData.endText
    this.isClinicalTask = this.associatedTask.isClinical
    const questionnaireName = this.associatedTask.name
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
    !questionnaireName.includes('DEMO') && this.processDataAndSend()
  }

  processDataAndSend() {
    return this.prepareDataService
      .processQuestionnaireData(
        this.questionnaireData.answers,
        this.questionnaireData.timestamps
      )
      .then(data =>
        this.sendToKafka(
          this.associatedTask,
          data,
          this.questionnaireData.questions
        )
      )
      .then(() =>
        this.finishTaskService.updateTaskToComplete(this.associatedTask)
      )
      .then(() => (this.showDoneButton = true))
      .catch(e => {
        console.log(e)
      })
  }

  sendToKafka(task: Task, questionnaireData, questions) {
    // NOTE: Submit data to kafka
    return Promise.all([
      this.kafkaService.prepareTimeZoneKafkaObjectAndSend(),
      this.kafkaService.prepareAnswerKafkaObjectAndSend(
        task,
        questionnaireData,
        questions
      ),
      this.kafkaService
        .prepareNonReportedTasksKafkaObjectAndSend(task)
        .then(() => this.finishTaskService.updateTaskToReportedCompletion(task))
    ])
  }

  handleClosePage() {
    this.showDoneButton = false
    this.evalClinicalFollowUpTask().then(() =>
      this.navCtrl.setRoot(HomePageComponent)
    )
  }

  evalClinicalFollowUpTask() {
    if (this.completedInClinic) {
      return this.storage
        .get(StorageKeys.SCHEDULE_TASKS_CLINICAL)
        .then(tasks => this.generateClinicalTasks(tasks))
    } else {
      return Promise.resolve({})
    }
  }

  generateClinicalTasks(tasks) {
    // TODO: To be refactored and moved in next PR.
    let clinicalTasks = []
    if (tasks) {
      clinicalTasks = tasks
    } else {
      tasks = []
    }
    const associatedTask = this.navParams.data['associatedTask']
    const protocol = this.navParams.data['associatedTask']['protocol']
    const repeatTimes = this.formatRepeatsAfterClinic(
      protocol['clinicalProtocol']['repeatAfterClinicVisit']
    )
    const now = new Date()
    for (let i = 0; i < repeatTimes.length; i++) {
      const ts = now.getTime() + repeatTimes[i]
      const clinicalTask: Task = {
        index: tasks.length + i,
        completed: false,
        reportedCompletion: false,
        timestamp: ts,
        name: associatedTask['name'],
        reminderSettings: protocol['reminders'],
        nQuestions: associatedTask['questions'].length,
        estimatedCompletionTime: associatedTask['estimatedCompletionTime'],
        completionWindow: DefaultTaskCompletionWindow,
        warning: '',
        isClinical: true
      }
      clinicalTasks.push(clinicalTask)
    }
    return this.storage
      .set(StorageKeys.SCHEDULE_TASKS_CLINICAL, clinicalTasks)
      .then(() =>
        this.notificationService.setNextXNotifications(
          DefaultNumberOfNotificationsToSchedule
        )
      )
  }

  formatRepeatsAfterClinic(repeats) {
    const repeatsInMillis = []
    const unit = repeats['unit']
    for (let i = 0; i < repeats['unitsFromZero'].length; i++) {
      const unitFromZero = repeats['unitsFromZero'][i]
      switch (unit) {
        case 'min': {
          const formatted = unitFromZero * 1000 * 60
          repeatsInMillis.push(formatted)
          break
        }
        case 'hour': {
          const formatted = unitFromZero * 1000 * 60 * 60
          repeatsInMillis.push(formatted)
          break
        }
        case 'day': {
          const formatted = unitFromZero * 1000 * 60 * 60 * 24
          repeatsInMillis.push(formatted)
          break
        }
      }
    }
    return repeatsInMillis
  }
}
