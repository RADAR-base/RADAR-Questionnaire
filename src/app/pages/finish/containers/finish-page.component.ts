import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultNumberOfNotificationsToSchedule } from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationService } from '../../../core/services/notification.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { Task } from '../../../shared/models/task'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { FinishTaskService } from '../services/finish-task.service'
import { PrepareDataService } from '../services/prepare-data.service'
import {Assessment} from "../../../shared/models/assessment";
import {SchedulingService} from "../../../core/services/scheduling.service";
import {RepeatQuestionnaire, TimeInterval} from "../../../shared/models/protocol";

@Component({
  selector: 'page-finish',
  templateUrl: 'finish-page.component.html'
})
export class FinishPageComponent {
  content: string = ''
  isClinicalTask: boolean = false
  completedInClinic: boolean = false
  displayNextTaskReminder: boolean = true
  hasClickedDoneButton: boolean = false
  associatedTask
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
    this.associatedTask = this.navParams.data.associatedTask
    this.content = this.navParams.data.endText
    const questionnaireName: string = this.navParams.data.associatedTask.name
    if (!questionnaireName.includes('DEMO')) {
      try {
        if (
          this.navParams.data['associatedTask']['protocol']['clinicalProtocol']
        ) {
          this.isClinicalTask = true
        }
      } catch (TypeError) {
        console.log('INFO: Not in clinic task/questionnaire.')
      }
      this.prepareDataService
        .process_QuestionnaireData(
          this.navParams.data.answers,
          this.navParams.data.timestamps
        )
        .then(
          data => {
            this.finishTaskService.updateTaskToComplete(this.associatedTask)
            this.sendToKafka(
              this.associatedTask,
              data,
              this.navParams.data.questions
            )
          },
          error => {
            console.log(JSON.stringify(error))
          }
        )
    } else {
      // This is a Demo Questionnaire. Just update to complete and do nothing else
      this.finishTaskService.updateTaskToComplete(
        this.navParams.data.associatedTask
      )
    }
    this.displayNextTaskReminder =
      !this.navParams.data.isLastTask && !this.isClinicalTask
  }

  sendToKafka(task: Task, questionnaireData, questions) {
    this.kafkaService.prepareTimeZoneKafkaObjectAndSend()
    this.kafkaService.prepareAnswerKafkaObjectAndSend(
      task,
      questionnaireData,
      questions
    )
    // NOTE: Submit data to kafka
  }

  handleClosePage() {
    this.hasClickedDoneButton = !this.hasClickedDoneButton
    this.evalClinicalFollowUpTask().then(() => {
      this.kafkaService.sendAllAnswersInCache()
      this.navCtrl.setRoot(HomePageComponent)
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
        completionWindow: SchedulingService.timeIntervalToMillis(associatedTask.protocol.completionWindow),
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
      }))
  }
}
