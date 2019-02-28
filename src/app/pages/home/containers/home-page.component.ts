import { Component, OnDestroy } from '@angular/core'
import { NavController, Platform } from 'ionic-angular'
import { Subscription } from 'rxjs'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { FirebaseAnalyticsService } from '../../../core/services/usage/firebaseAnalytics.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { Task, TasksProgress } from '../../../shared/models/task'
import { checkTaskIsNow } from '../../../shared/utilities/check-task-is-now'
import { ClinicalTasksPageComponent } from '../../clinical-tasks/containers/clinical-tasks-page.component'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { SettingsPageComponent } from '../../settings/containers/settings-page.component'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { HomeService } from '../services/home.service'
import { TasksService } from '../services/tasks.service'
import { HomePageAnimations } from './home-page.animation'

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html',
  animations: HomePageAnimations
})
export class HomePageComponent implements OnDestroy {
  sortedTasks: Promise<Map<any, any>>
  tasks: Promise<Task[]>
  tasksDate: Date
  nextTask: Task
  showCalendar = false
  showCompleted = false
  tasksProgress: Promise<TasksProgress>
  startingQuestionnaire = false
  hasClinicalTasks: Promise<boolean>
  taskIsNow = false
  checkTaskInterval
  resumeListener: Subscription = new Subscription()

  constructor(
    public navCtrl: NavController,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    private platform: Platform,
    private firebaseAnalytics: FirebaseAnalyticsService,
    private home: HomeService
  ) {
    this.resumeListener = this.platform.resume.subscribe(e => {
      this.checkForNewDate()
      this.firebaseAnalytics.logEvent('resumed', {})
      this.onResume()
    })
  }

  ngOnDestroy() {
    this.resumeListener.unsubscribe()
  }

  ionViewWillEnter() {
    this.startingQuestionnaire = false
  }

  ionViewDidLoad() {
    this.init()
    this.home.sendOpenEvent()
    this.firebaseAnalytics.setCurrentScreen('home-page')
  }

  init() {
    this.sortedTasks = this.tasksService.getSortedTasksOfToday()
    this.tasks = this.tasksService.getTasksOfToday()
    this.tasksDate = new Date()
    this.tasksProgress = this.tasksService.getTaskProgress()
    this.tasks.then(tasks => {
      this.checkTaskInterval = setInterval(() => {
        this.checkForNextTask(tasks)
      }, 1000)
    })
    this.hasClinicalTasks = this.tasksService.evalHasClinicalTasks()
  }

  onResume() {
    this.home.sendOpenEvent()
    this.home.emptyCache()
    this.checkForNewDate()
  }

  checkForNewDate() {
    if (new Date().getDate() !== this.tasksDate.getDate()) {
      this.tasksDate = new Date()
      this.navCtrl.setRoot(SplashPageComponent)
    }
  }

  checkForNextTask(tasks) {
    const task = this.tasksService.getNextTask(tasks)
    if (task) {
      this.nextTask = task
      this.taskIsNow = checkTaskIsNow(this.nextTask.timestamp)
    } else {
      this.taskIsNow = false
      this.nextTask = null
      this.showCompleted = this.tasksService.areAllTasksComplete(tasks)
      if (this.showCompleted) {
        clearInterval(this.checkTaskInterval)
        this.showCalendar = false
      }
    }
  }

  displayTaskCalendar() {
    this.firebaseAnalytics.logEvent('click', { button: 'show_task_calendar' })
    this.showCalendar = !this.showCalendar
  }

  openSettingsPage() {
    this.firebaseAnalytics.logEvent('click', { button: 'open_settings' })
    this.navCtrl.push(SettingsPageComponent)
  }

  openClinicalTasksPage() {
    this.firebaseAnalytics.logEvent('click', { button: 'open_clinical_tasks' })
    this.navCtrl.push(ClinicalTasksPageComponent)
  }

  startQuestionnaire(taskCalendarTask: Task) {
    this.firebaseAnalytics.logEvent('click', { button: 'start_questionnaire' })
    // NOTE: User can start questionnaire from task calendar or start button in home.
    const task = taskCalendarTask ? taskCalendarTask : this.nextTask

    if (this.tasksService.isTaskValid(task)) {
      this.startingQuestionnaire = true
      this.home.sendStartEvent()
      return this.tasksService
        .getQuestionnairePayload(task)
        .then(payload => this.navCtrl.push(QuestionsPageComponent, payload))
    } else {
      this.showMissedInfo()
    }
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

  showMissedInfo() {
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.CALENDAR_ESM_MISSED_TITLE),
      message: this.localization.translateKey(LocKeys.CALENDAR_ESM_MISSED_DESC),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {}
        }
      ]
    })
  }
}
