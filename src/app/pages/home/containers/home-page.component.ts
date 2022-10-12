import { Component, OnDestroy } from '@angular/core'
import { NavController, Platform } from 'ionic-angular'
import { Subscription } from 'rxjs'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../shared/enums/events'
import { LocKeys } from '../../../shared/enums/localisations'
import { Task, TasksProgress } from '../../../shared/models/task'
import { checkTaskIsNow } from '../../../shared/utilities/check-task-is-now'
import { ClinicalTasksPageComponent } from '../../clinical-tasks/containers/clinical-tasks-page.component'
import { OnDemandPageComponent } from '../../on-demand/containers/on-demand-page.component'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { SettingsPageComponent } from '../../settings/containers/settings-page.component'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { TasksService } from '../services/tasks.service'
import { HomePageAnimations } from './home-page.animation'

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html',
  animations: HomePageAnimations
})
export class HomePageComponent implements OnDestroy {
  title: Promise<string>
  sortedTasks: Promise<Map<any, any>>
  tasks: Promise<Task[]>
  currentDate: Date
  nextTask: Task
  timeToNextTask: number
  tasksProgress: Promise<TasksProgress>
  resumeListener: Subscription = new Subscription()
  changeDetectionListener: Subscription = new Subscription()

  showCalendar = false
  showCompleted = false
  startingQuestionnaire = false
  hasClinicalTasks: Promise<boolean>
  hasOnDemandTasks: Promise<boolean>
  onDemandIcon: Promise<string>
  taskIsNow = false
  checkTaskInterval
  showMiscTasksButton: Promise<boolean>
  isTaskCalendarTaskNameShown: Promise<boolean>

  APP_CREDITS = '&#169; RADAR-Base'
  HTML_BREAK = '<br>'

  constructor(
    public navCtrl: NavController,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    private platform: Platform,
    private usage: UsageService
  ) {
    this.resumeListener = this.platform.resume.subscribe(() => this.onResume())
    this.changeDetectionListener = this.tasksService.changeDetectionEmitter.subscribe(
      () => {
        console.log('Changes to task service detected')
        this.navCtrl.setRoot(HomePageComponent)
      }
    )
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
    this.changeDetectionListener.unsubscribe()
  }

  ionViewWillEnter() {
    this.startingQuestionnaire = false
  }

  ionViewDidLoad() {
    this.init()
    this.usage.setPage(this.constructor.name)
  }

  init() {
    this.sortedTasks = this.tasksService.getValidTasksMap()
    this.tasks = this.tasksService.getTasksOfToday()
    this.currentDate = this.tasksService.getCurrentDateMidnight()
    this.tasksProgress = this.tasksService.getTaskProgress()
    this.tasks.then(tasks => {
      this.checkTaskInterval = setInterval(() => {
        this.checkForNextTask(tasks)
      }, 1500)
    })
    this.hasOnDemandTasks = this.tasksService.getHasOnDemandTasks()
    this.hasClinicalTasks = this.tasksService.getHasClinicalTasks()
    this.title = this.tasksService.getPlatformInstanceName()
    this.isTaskCalendarTaskNameShown = this.tasksService.getIsTaskCalendarTaskNameShown()
    this.onDemandIcon = this.tasksService.getOnDemandAssessmentIcon()
    this.showMiscTasksButton = this.getShowMiscTasksButton()
  }

  onResume() {
    this.usage.sendOpenEvent()
    this.checkForNewDate()
    this.usage.sendGeneralEvent(UsageEventType.RESUMED)
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
      this.timeToNextTask = this.nextTask.timestamp - Date.now()
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
    this.usage.sendClickEvent('show_task_calendar')
    this.showCalendar = !this.showCalendar
  }

  openSettingsPage() {
    this.navCtrl.push(SettingsPageComponent)
    this.usage.sendClickEvent('open_settings')
  }

  openClinicalTasksPage() {
    this.navCtrl.push(ClinicalTasksPageComponent)
    this.usage.sendClickEvent('open_clinical_tasks')
  }

  openOnDemandTasksPage() {
    this.navCtrl.push(OnDemandPageComponent)
    this.usage.sendClickEvent('open_on_demand_tasks')
  }

  startQuestionnaire(taskCalendarTask: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    const task = taskCalendarTask ? taskCalendarTask : this.nextTask

    if (this.tasksService.isTaskStartable(task)) {
      this.usage.sendClickEvent('start_questionnaire')
      this.startingQuestionnaire = true
      return this.navCtrl.push(QuestionsPageComponent, task)
    } else {
      this.showMissedInfo()
    }
  }

  showCredits() {
    this.usage.sendClickEvent('show_credits')
    return Promise.all([
      this.tasksService.getAppCreditsTitle(),
      this.tasksService.getAppCreditsBody()
    ]).then(([title, body]) =>
      this.alertService.showAlert({
        title: this.localization.chooseText(title),
        message:
          this.localization.chooseText(body) +
          this.HTML_BREAK +
          this.HTML_BREAK +
          this.APP_CREDITS,
        buttons: [
          {
            text: this.localization.translateKey(LocKeys.BTN_OKAY),
            handler: () => {}
          }
        ]
      })
    )
  }

  showMissedInfo() {
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.CALENDAR_TASK_MISSED_TITLE),
      message: this.localization.translateKey(
        LocKeys.CALENDAR_TASK_MISSED_DESC
      ),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => {}
        }
      ]
    })
  }

  getShowMiscTasksButton() {
    return Promise.all([this.hasOnDemandTasks, this.hasClinicalTasks]).then(
      ([onDemand, clinical]) => onDemand || clinical
    )
  }
}
