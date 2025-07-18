import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { NavController, Platform, LoadingController } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { ConfigService } from '../../../core/services/config/config.service'
import { UsageEventType } from '../../../shared/enums/events'
import { LocKeys } from '../../../shared/enums/localisations'
import { Task, TasksProgress } from '../../../shared/models/task'
import { checkTaskIsNow } from '../../../shared/utilities/check-task-is-now'
import { TasksService } from '../services/tasks.service'
import { HomePageAnimations } from './home-page.animation'

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html',
  animations: HomePageAnimations,
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy {
  title: Promise<string>
  sortedTasks: Promise<Map<any, any>>
  tasks: Promise<Task[]>
  nextTask: Task
  timeToNextTask: number
  tasksProgress = Promise.resolve({ numberOfTasks: 0, completedTasks: 5 })
  resumeListener: Subscription = new Subscription()
  changeDetectionListener: Subscription = new Subscription()
  cacheProgressSubscription: Subscription = new Subscription()
  lastTaskRefreshTime = Date.now()

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
  isTaskInfoShown: Promise<boolean>
  currentDate: number
  studyPortalReturnUrl: Promise<string | null>

  APP_CREDITS = '&#169; RADAR-Base'
  HTML_BREAK = '<br>'
  // How long to wait before refreshing tasks
  TASK_REFRESH_MILLIS = 600_000
  CACHE_SENDING_ALERT_TIMEOUT = 1_200_000 // 20 minutes
  MIN_CACHE_SIZE_TO_SEND = 5

  constructor(
    private router: Router,
    public navCtrl: NavController,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    private platform: Platform,
    private usage: UsageService,
    private configService: ConfigService,
    private loadingController: LoadingController
  ) {
    this.changeDetectionListener =
      this.tasksService.changeDetectionEmitter.subscribe(() => {
        console.log('Changes to task service detected..')
        this.navCtrl.navigateRoot('')
      })
  }

  ngOnInit() {
    this.usage.setPage(this.constructor.name)
    this.platform
      .ready()
      .then(() => this.tasksService.init().then(() => this.init()))
  }

  ngOnDestroy() {
    // Unsubscribe to avoid memory leaks when the page is left
    if (this.resumeListener) {
      this.resumeListener.unsubscribe();
    }
    this.changeDetectionListener.unsubscribe()
    if (this.cacheProgressSubscription) {
      this.cacheProgressSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.nextTask = null
    this.startingQuestionnaire = false
    this.tasksProgress = this.tasksService.getTaskProgress()
    this.sortedTasks = this.tasksService.getValidTasksMap()
    this.tasks = this.tasksService.getTasksOfToday()
    this.showCalendar = false
    this.resumeListener = this.platform.resume.subscribe(() => this.onResume())
  }

  ionViewDidEnter() {
    this.tasksService.getAutoSendCachedData().then(autoSendCachedData => {
      if (autoSendCachedData === 'true') {
        this.sendCachedData()
      }
    })
  }

  ionViewWillLeave() {
    // Unsubscribe to avoid memory leaks when the page is left
    if (this.resumeListener) {
      this.resumeListener.unsubscribe();
    }
  }

  init() {
    this.sortedTasks = this.tasksService.getValidTasksMap()
    this.tasks = this.tasksService.getTasksOfToday()
    this.tasksProgress = this.tasksService.getTaskProgress()
    this.checkTaskInterval = setInterval(() => this.checkForNextTask(), 1500)
    this.hasOnDemandTasks = this.tasksService.getHasOnDemandTasks()
    this.hasClinicalTasks = this.tasksService.getHasClinicalTasks()
    this.title = this.tasksService.getPlatformInstanceName()
    this.isTaskCalendarTaskNameShown =
      this.tasksService.getIsTaskCalendarTaskNameShown()
    this.isTaskInfoShown = this.tasksService.getIsTaskInfoShown()
    this.onDemandIcon = this.tasksService.getOnDemandAssessmentIcon()
    this.showMiscTasksButton = this.getShowMiscTasksButton()
    this.studyPortalReturnUrl = this.tasksService.getPortalReturnUrl()

  }

  onResume() {
    this.usage.sendOpenEvent()
    this.checkForNewDate()
    this.usage.sendGeneralEvent(UsageEventType.RESUMED)
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
      !this.showCalendar &&
      !this.getIsLoadingSpinnerShown()
    )
  }

  checkForNewDate() {
    if (Date.now() - this.lastTaskRefreshTime > this.TASK_REFRESH_MILLIS) {
      this.lastTaskRefreshTime = Date.now()
      this.currentDate = this.tasksService.getCurrentDateMidnight().getTime()
      this.navCtrl.navigateRoot('')
    }
  }

  checkForNextTask() {
    this.tasks.then(tasks => {
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
    })
  }

  displayTaskCalendar() {
    this.usage.sendClickEvent('show_task_calendar')
    this.showCalendar = !this.showCalendar
  }

  openSettingsPage() {
    this.navCtrl.navigateForward('settings')
    this.usage.sendClickEvent('open_settings')
  }

  openClinicalTasksPage() {
    this.navCtrl.navigateForward('/clinical-tasks')
    this.usage.sendClickEvent('open_clinical_tasks')
  }

  openOnDemandTasksPage() {
    this.navCtrl.navigateForward('/on-demand')
    this.usage.sendClickEvent('open_on_demand_tasks')
  }

  async openStudyPortal() {
    window.open(await this.studyPortalReturnUrl, '_system')
  }

  startQuestionnaire(taskCalendarTask?: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    const task = taskCalendarTask ? taskCalendarTask : this.nextTask

    if (this.tasksService.isTaskStartable(task)) {
      this.usage.sendClickEvent('start_questionnaire')
      this.startingQuestionnaire = true
      this.navCtrl.navigateForward('/questions', { state: task })
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
        header: this.localization.chooseText(title),
        message:
          this.localization.chooseText(body) +
          this.HTML_BREAK +
          this.HTML_BREAK +
          this.APP_CREDITS,
        buttons: [
          {
            text: this.localization.translateKey(LocKeys.BTN_OKAY),
            handler: () => { }
          }
        ]
      })
    )
  }

  showMissedInfo() {
    return this.alertService.showAlert({
      header: this.localization.translateKey(
        LocKeys.CALENDAR_TASK_MISSED_TITLE
      ),
      message: this.localization.translateKey(
        LocKeys.CALENDAR_TASK_MISSED_DESC
      ),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => { }
        }
      ]
    })
  }

  getShowMiscTasksButton() {
    return Promise.all([this.hasOnDemandTasks, this.hasClinicalTasks]).then(
      ([onDemand, clinical]) => onDemand || clinical
    )
  }

  async sendCachedData() {
    const kafkaService = this.configService.getKafkaService()
    const cacheSize = await kafkaService.getCacheSize()
    if (cacheSize < this.MIN_CACHE_SIZE_TO_SEND) {
      return
    }
    // Create loading overlay with initial message
    const loading = await this.loadingController.create({
      message: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_MESSAGE),
      spinner: 'lines',
      backdropDismiss: false
    })
    await loading.present()

    // Subscribe to progress updates
    const startTime = Date.now()
    const progressSub = kafkaService.eventCallback$.subscribe({
      next: (progress: number) => {
        const progressDisplay = Math.min(Math.max(Math.ceil(progress * 100), 1), 99)

        let message = this.localization.translateKey(LocKeys.HOME_SENDING_DATA_MESSAGE)
        message += `<br><br><strong>${this.localization.translateKey(LocKeys.HOME_SENDING_DATA_PROGRESS)}: ${progressDisplay}%</strong>`

        // Calculate time remaining
        const elapsedTime = (Date.now() - startTime) / 1000
        const remainingTime = isFinite(elapsedTime * (100 - progressDisplay) / progressDisplay)
          ? (elapsedTime * (100 - progressDisplay)) / progressDisplay
          : 0

        let etaText = ''
        if (remainingTime >= 60) {
          const minutes = Math.floor(remainingTime / 60)
          const seconds = Math.round(remainingTime % 60)
          etaText = `About ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
        } else if (remainingTime > 0) {
          etaText = `About ${remainingTime.toFixed(0)} second${remainingTime.toFixed(0) !== '1' ? 's' : ''} remaining`
        }
        message += `<br>${etaText}`

        loading.message = message
      },
      error: (error) => {
        loading.dismiss()
        this.alertService.showAlert({
          header: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_TITLE),
          message: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_MESSAGE),
          buttons: [
            {
              text: this.localization.translateKey(LocKeys.BTN_OKAY),
              handler: () => { }
            }
          ]
        })
        console.error('Error in progress tracking:', error)
      }
    })

    // Send cached data asynchronously
    kafkaService.sendAllFromCache()
      .then(() => {
        progressSub.unsubscribe()
        loading.dismiss()
      })
      .catch((error) => {
        progressSub.unsubscribe()
        loading.dismiss()
        this.alertService.showAlert({
          header: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_TITLE),
          message: this.localization.translateKey(LocKeys.HOME_SENDING_DATA_ERROR_MESSAGE),
          buttons: [
            {
              text: this.localization.translateKey(LocKeys.BTN_OKAY),
              handler: () => { }
            }
          ]
        })
        console.error('Error sending cached data:', error)
      })
  }
}
