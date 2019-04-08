import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import {
  DefaultNumberOfNotificationsToSchedule,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { FirebaseAnalyticsService } from '../../../core/services/firebaseAnalytics.service'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { Assessment } from '../../../shared/models/assessment'
import { RepeatQuestionnaire } from '../../../shared/models/protocol'
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
    public storage: StorageService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {}

  ionViewDidLoad() {
    this.questionnaireData = this.navParams.data
    this.associatedTask = this.questionnaireData.associatedTask
    this.content = this.questionnaireData.endText
    this.isClinicalTask = this.associatedTask.isClinical !== false
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
    this.processDataAndSend()
    this.firebaseAnalytics.setCurrentScreen('finish-page')
    this.firebaseAnalytics.logEvent('questionnaire_finished', {
      questionnaire_timestamp: String(this.associatedTask.timestamp),
      type: this.associatedTask.name
    })
    setTimeout(() => (this.showDoneButton = true), 15000)
  }

  processDataAndSend() {
    this.finishTaskService.updateTaskToComplete(this.associatedTask)
    if (!this.associatedTask.name.includes('DEMO')) {
      const data = this.prepareDataService.processQuestionnaireData(
        this.questionnaireData.answers,
        this.questionnaireData.timestamps
      )
      this.firebaseAnalytics.logEvent('processed_questionnaire_data', {
        questionnaire_timestamp: String(Date.now()),
        type: this.associatedTask.name
      })
      return this.sendToKafka(
        this.associatedTask,
        data,
        this.questionnaireData.questions
      )
        .catch(e => console.log(e))
        .then(() => (this.showDoneButton = true))
    } else this.showDoneButton = true
  }

  sendToKafka(task: Task, data, questions) {
    // NOTE: Submit data to kafka
    return this.storage.get(StorageKeys.CONFIG_VERSION).then(configVersion =>
      Promise.all([
        this.kafkaService.prepareTimeZoneKafkaObjectAndSend(),
        this.kafkaService.prepareAnswerKafkaObjectAndSend(
          task,
          {
            answers: data,
            configVersion: configVersion
          },
          questions
        ),
        this.kafkaService
          .prepareNonReportedTasksKafkaObjectAndSend(task)
          .then(() =>
            this.finishTaskService.updateTaskToReportedCompletion(task)
          )
      ])
    )
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
    if (!tasks) {
      tasks = []
    }
    const associatedTask: Assessment = this.navParams.data.associatedTask
    const protocol = associatedTask.protocol
    const repeatTimes = this.formatRepeatsAfterClinic(
      protocol.clinicalProtocol.repeatAfterClinicVisit
    )
    const now = new Date().getTime()
    const clinicalTasks = tasks.concat(
      repeatTimes.map((repeatTime, i) => ({
        index: tasks.length + i,
        completed: false,
        reportedCompletion: false,
        timestamp: now + repeatTime,
        name: associatedTask.name,
        reminderSettings: protocol.reminders,
        nQuestions: associatedTask.questions.length,
        estimatedCompletionTime: associatedTask.estimatedCompletionTime,
        completionWindow: DefaultTaskCompletionWindow,
        warning: '',
        isClinical: true
      }))
    )

    return this.storage
      .set(StorageKeys.SCHEDULE_TASKS_CLINICAL, clinicalTasks)
      .then(() =>
        this.notificationService.setNextXNotifications(
          DefaultNumberOfNotificationsToSchedule
        )
      )
  }

  formatRepeatsAfterClinic(repeats: RepeatQuestionnaire) {
    return repeats.unitFromZero.map(amount =>
      SchedulingService.timeIntervalToMillis({
        unit: repeats.unit,
        amount
      })
    )
  }
}
