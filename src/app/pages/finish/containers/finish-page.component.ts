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
