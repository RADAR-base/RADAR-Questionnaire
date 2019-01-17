import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component } from '@angular/core'
import { NavController, Platform } from 'ionic-angular'

import { AlertService } from '../../../core/services/alert.service'
import { KafkaService } from '../../../core/services/kafka.service'
import { LocalizationService } from '../../../core/services/localization.service'
import { StorageService } from '../../../core/services/storage.service'
import { UsageService } from '../../../core/services/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import { Task, TasksProgress } from '../../../shared/models/task'
import { checkTaskIsNow } from '../../../shared/utilities/check-task-is-now'
import { ClinicalTasksPageComponent } from '../../clinical-tasks/containers/clinical-tasks-page.component'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { SettingsPageComponent } from '../../settings/containers/settings-page.component'
import { StartPageComponent } from '../../start/containers/start-page.component'
import { TasksService } from '../services/tasks.service'

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html',
  animations: [
    trigger('displayCalendar', [
      state('true', style({ transform: 'translateY(0%)' })),
      state('false', style({ transform: 'translateY(100%)' })),
      transition('*=>*', animate('300ms ease-out'))
    ]),
    trigger('moveProgress', [
      state('true', style({ transform: 'translateY(-100%)' })),
      state('false', style({ transform: 'translateY(0%)' })),
      transition('*=>*', animate('300ms ease-out'))
    ])
  ]
})
export class HomePageComponent {
  tasks: Promise<Task[]>
  nextTask: Task
  showCalendar = false
  showCompleted = false
  showNoTasksToday = false
  tasksProgress: TasksProgress = { numberOfTasks: 1, completedTasks: 0 }
  startingQuestionnaire = false
  hasClinicalTasks = false
  taskIsNow = false
  checkTaskInterval

  constructor(
    public navCtrl: NavController,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    public storage: StorageService,
    private platform: Platform,
    private kafka: KafkaService,
    private usage: UsageService
  ) {
    this.platform.resume.subscribe(() => this.onResume())
  }

  ionViewWillEnter() {
    this.startingQuestionnaire = false
    this.kafka.sendToKafkaFromCache()
  }

  ionViewDidLoad() {
    this.tasks = this.tasksService.getTasksOfToday()
    this.tasks.then(tasks => {
      this.checkTaskInterval = setInterval(() => {
        this.checkForNextTask()
      }, 1000)
      this.tasksProgress = this.tasksService.getTaskProgress(tasks)
      this.showNoTasksToday = this.tasksProgress.numberOfTasks == 0
    })
    this.evalHasClinicalTasks()
    this.tasksService.sendNonReportedTaskCompletion()
  }

  onResume() {
    this.usage.sendOpen(new Date().getTime() / 1000)
    this.kafka.sendToKafkaFromCache()
    this.checkForNextTask()
  }

  checkForNextTask() {
    this.tasks.then(tasks =>
      this.checkForNextTaskGeneric(this.tasksService.getNextTask(tasks))
    )
  }

  checkForNextTaskGeneric(task) {
    if (task && task.isClinical == false) {
      this.nextTask = task
      this.taskIsNow = checkTaskIsNow(this.nextTask.timestamp)
      this.showCompleted = !this.nextTask
    } else {
      this.taskIsNow = false
      this.nextTask = null
      this.tasks.then(tasks => {
        this.showCompleted = this.tasksService.areAllTasksComplete(tasks)
        if (this.showCompleted) {
          clearInterval(this.checkTaskInterval)
          this.showCalendar = false
        }
      })
    }
  }

  evalHasClinicalTasks() {
    this.storage.get(StorageKeys.HAS_CLINICAL_TASKS).then(isClinical => {
      this.hasClinicalTasks = isClinical
    })
  }

  displayTaskCalendar() {
    this.showCalendar = !this.showCalendar
  }

  openSettingsPage() {
    this.navCtrl.push(SettingsPageComponent)
  }

  openClinicalTasksPage() {
    this.navCtrl.push(ClinicalTasksPageComponent)
  }

  startQuestionnaire(taskCalendarTask: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    let startQuestionnaireTask = this.nextTask
    if (taskCalendarTask) {
      if (taskCalendarTask.completed === false) {
        startQuestionnaireTask = taskCalendarTask
      }
    } else {
      this.startingQuestionnaire = true
    }

    return this.tasksService
      .getAssessment(startQuestionnaireTask)
      .then(assessment => {
        const params = {
          title: assessment.name,
          introduction: this.localization.chooseText(assessment.startText),
          endText: this.localization.chooseText(assessment.endText),
          questions: assessment.questions,
          associatedTask: startQuestionnaireTask,
          assessment: assessment,
          isLastTask: false
        }

        this.tasksService
          .isLastTask(startQuestionnaireTask, this.tasks)
          .then(lastTask => (params.isLastTask = lastTask))
          .then(() => {
            if (assessment.showIntroduction) {
              this.navCtrl.push(StartPageComponent, params)
            } else {
              this.navCtrl.push(QuestionsPageComponent, params)
            }
          })
      })
  }

  showCredits() {
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.CREDITS_TITLE),
      message: this.localization.translateKey(LocKeys.CREDITS_BODY),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {}
        }
      ]
    })
  }
}
