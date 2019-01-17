import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import {
  KAFKA_ASSESSMENT,
  KAFKA_TIMEZONE
} from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationGeneratorService } from '../../../core/services/notification-generator.service'
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
  hasClickedDoneButton = false
  associatedTask
  questionnaireData

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private kafkaService: KafkaService,
    private prepareDataService: PrepareDataService,
    private notificationGenerator: NotificationGeneratorService,
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
    this.finishTaskService.updateTaskToComplete(this.associatedTask)
    this.displayNextTaskReminder =
      !this.questionnaireData.isLastTask && !this.isClinicalTask
    !questionnaireName.includes('DEMO') && this.processDataAndSend()
  }

  processDataAndSend() {
    return this.prepareDataService
      .processQuestionnaireData(this.questionnaireData)
      .then(
        processedAnswers => {
          this.sendToKafka(processedAnswers, this.associatedTask)
        },
        error => {
          console.log(JSON.stringify(error))
        }
      )
  }

  sendToKafka(processedAnswers, task) {
    // NOTE: Submit data to kafka
    this.kafkaService.prepareKafkaObjectAndSend(KAFKA_TIMEZONE, {})
    this.kafkaService.prepareKafkaObjectAndSend(KAFKA_ASSESSMENT, {
      task: task,
      data: processedAnswers
    })
  }

  handleClosePage() {
    this.evalClinicalFollowUpTask().then(() => {
      this.hasClickedDoneButton = !this.hasClickedDoneButton
      return this.navCtrl.setRoot(HomePageComponent)
    })
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
    const clinicalTasks: Task[] = tasks.concat(
      repeatTimes
        .map(
          (repeatTime, i) =>
            ({
              index: tasks.length + i,
              completed: false,
              reportedCompletion: false,
              timestamp: now + repeatTime,
              name: associatedTask.name,
              nQuestions: associatedTask.questions.length,
              estimatedCompletionTime: associatedTask.estimatedCompletionTime,
              completionWindow: SchedulingService.timeIntervalToMillis(
                associatedTask.protocol.completionWindow
              ),
              warning: '',
              isClinical: true
            } as Task)
        )
        .map(t => {
          t.notifications = this.notificationGenerator.createNotifications(
            associatedTask,
            t
          )
          return t
        })
    )

    return this.storage
      .set(StorageKeys.SCHEDULE_TASKS_CLINICAL, clinicalTasks)
      .then(() => this.storage.get(StorageKeys.PARTICIPANTLOGIN))
      .then(username => {
        if (username) {
          return this.notificationService.publish(username)
        }
      })
  }

  formatRepeatsAfterClinic(repeats: RepeatQuestionnaire) {
    return repeats.unitsFromZero.map(amount =>
      SchedulingService.timeIntervalToMillis({
        unit: repeats.unit,
        amount
      })
    )
  }
}
