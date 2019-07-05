import { Component, OnDestroy } from '@angular/core'
import { NavController, Platform } from 'ionic-angular'
import { Task, TasksProgress } from '../../../shared/models/task'

import { AlertService } from '../../../core/services/misc/alert.service'
import { ClinicalTasksPageComponent } from '../../clinical-tasks/containers/clinical-tasks-page.component'
import { FirebaseAnalyticsService } from '../../../core/services/usage/firebaseAnalytics.service'
import { HomePageAnimations } from './home-page.animation'
import { HomeService } from '../services/home.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { SettingsPageComponent } from '../../settings/containers/settings-page.component'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { Subscription } from 'rxjs'
import { TasksService } from '../services/tasks.service'
import { checkTaskIsNow } from '../../../shared/utilities/check-task-is-now'

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html',
  animations: HomePageAnimations
})
export class HomePageComponent implements OnDestroy {
  sortedTasks: Promise<Map<any, any>>
  tasks: Promise<Task[]>
  currentDate: Date
  nextTask: Task
  tasksProgress: Promise<TasksProgress>
  resumeListener: Subscription = new Subscription()

  showCalendar = false
  showCompleted = false
  startingQuestionnaire = false
  hasClinicalTasks: Promise<boolean>
  taskIsNow = false
  checkTaskInterval

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

  getIsLoadingSpinnerShown() {
    return (
      (this.startingQuestionnaire && !this.showCalendar) ||
      (!this.nextTask && !this.showCompleted)
    )
  }

  getIsStartButtonShown() {
    return (
      this.taskIsNow &&
      !this.startingQuestionnaire &&
      !this.showCompleted &&
      !this.showCalendar
    )
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
    this.currentDate = this.tasksService.getCurrentDateMidnight()
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
    if (new Date().getDate() !== this.currentDate.getDate()) {
      this.currentDate = this.tasksService.getCurrentDateMidnight()
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
    this.navCtrl.push(SettingsPageComponent)
    this.firebaseAnalytics.logEvent('click', { button: 'open_settings' })
  }

  openClinicalTasksPage() {
    this.navCtrl.push(ClinicalTasksPageComponent)
    this.firebaseAnalytics.logEvent('click', { button: 'open_clinical_tasks' })
  }

  startQuestionnaire(taskCalendarTask: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    const task = taskCalendarTask ? taskCalendarTask : this.nextTask

    if (this.tasksService.isTaskStartable(task)) {
      this.firebaseAnalytics.logEvent('click', {
        button: 'start_questionnaire'
      })
      this.startingQuestionnaire = true
      this.home.sendStartEvent(task)
      return this.tasksService
        .getQuestionnairePayload(task)
        .then(payload => this.navCtrl.push(QuestionsPageComponent, payload))
    } else {
      this.showMissedInfo()
    }
  }

  showCredits() {
    this.firebaseAnalytics.logEvent('click', { button: 'show_credits' })
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
