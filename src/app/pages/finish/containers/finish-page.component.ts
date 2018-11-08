import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultNumberOfNotificationsToSchedule } from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { Task } from '../../../shared/models/task'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { PrepareDataService } from '../services/prepare-data.service'

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
    private schedule: SchedulingService,
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
            this.schedule.updateTaskToComplete(this.associatedTask)
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
      this.schedule.updateTaskToComplete(this.navParams.data.associatedTask)
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
        .then(tasks =>
          this.schedule.generateClinicalTasks(
            tasks,
            this.navParams.data.associatedTask
          )
        )
        .then(() =>
          this.notificationService.setNextXNotifications(
            DefaultNumberOfNotificationsToSchedule
          )
        )
    } else {
      return Promise.resolve({})
    }
  }
}
