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
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { SettingsPageComponent } from '../../settings/containers/settings-page.component'
import { SplashPageComponent } from '../../splash/containers/splash-page.component'
import { TasksService } from '../services/tasks.service'
import { HomePageAnimations } from './home-page.animation'
import {LogService} from "../../../core/services/misc/log.service";

enum Page {Settings = 'settings', Learn = 'learn', Home = 'home' }

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
  uncompletedTasks: Promise<Task[]>
  nextTask: Task
  tasksProgress: Promise<TasksProgress>
  resumeListener: Subscription = new Subscription()

  showCalendar = false
  showCompleted = false
  // showNoTasksToday = false
  // tasksProgress: TasksProgress = { numberOfTasks: 1, completedTasks: 0, completedPercentage: 0}
  startingQuestionnaire = false
  hasClinicalTasks: Promise<boolean>
  taskIsNow = false
  checkTaskInterval
  learnItems: any
  selectedPage: Page

  constructor(
    public navCtrl: NavController,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    private platform: Platform,
    private usage: UsageService,
    private logger: LogService
  ) {
    this.selectedPage = Page.Home;
    this.resumeListener = this.platform.resume.subscribe(e => {
      this.checkForNewDate()
      this.usage.sendGeneralEvent(UsageEventType.RESUMED)
      this.onResume()
    })
    this.learnItems = [
      {
        name: 'Privacy Policy',
        icon: 'eye'
      },
      {
        name: 'About the Study',
        icon: 'stats'
      }
    ]

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
    this.usage.sendOpenEvent()
    this.usage.setPage(this.constructor.name)
  }

  init() {
    // this.uncompletedTasks = this.tasksService.getTasksToComplete();
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
    this.title = this.tasksService.getPlatformInstanceName()
  }

  onResume() {
    this.usage.sendOpenEvent()
    // this.uncompletedTasks = this.tasksService.getTasksToComplete();
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

  startQuestionnaire(taskCalendarTask: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    const task = taskCalendarTask ? taskCalendarTask : this.nextTask

    if (this.tasksService.isTaskStartable(task)) {
      this.usage.sendClickEvent('start_questionnaire')
      this.startingQuestionnaire = true
      return this.tasksService
        .getQuestionnairePayload(task)
        .then(payload => this.navCtrl.push(QuestionsPageComponent, payload))
    } else {
      this.showMissedInfo()
    }
  }

  showCredits() {
    this.usage.sendClickEvent('show_credits')
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

  getLearnItems(type: any) {
    return this.learnItems[type];
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

  onFooterChange(event) {
    this.logger.log("Event is " + JSON.stringify(event))
  }
}
