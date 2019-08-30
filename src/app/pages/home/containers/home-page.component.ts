import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
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

@Component({
  selector: 'page-home',
  templateUrl: 'home-page.component.html',
  animations: HomePageAnimations
})
export class HomePageComponent implements OnInit, OnDestroy {
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
    private router: Router,
    public alertService: AlertService,
    private tasksService: TasksService,
    private localization: LocalizationService,
    private platform: Platform,
    private usage: UsageService
  ) {
    this.resumeListener = this.platform.resume.subscribe(e => {
      this.checkForNewDate()
      this.usage.sendGeneralEvent(UsageEventType.RESUMED)
      this.onResume()
    })
  }

  ngOnInit() {
    this.init()
    this.usage.sendOpenEvent()
    this.usage.setPage(this.constructor.name)
    this.startingQuestionnaire = false
  }

  ngOnDestroy() {
    this.resumeListener.unsubscribe()
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
    this.usage.sendOpenEvent()
    this.checkForNewDate()
  }

  checkForNewDate() {
    if (new Date().getDate() !== this.currentDate.getDate()) {
      this.currentDate = this.tasksService.getCurrentDateMidnight()
      this.router.navigate(['/splash'])
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
    this.router.navigate(['/settings'])
    this.usage.sendClickEvent('open_settings')
  }

  openClinicalTasksPage() {
    this.router.navigate(['/clinical-tasks'])
    this.usage.sendClickEvent('open_clinical_tasks')
  }

  startQuestionnaire(taskCalendarTask: Task) {
    // NOTE: User can start questionnaire from task calendar or start button in home.
    const task = taskCalendarTask ? taskCalendarTask : this.nextTask

    if (this.tasksService.isTaskStartable(task)) {
      this.usage.sendClickEvent('start_questionnaire')
      this.startingQuestionnaire = true
      return this.router.navigate(['/questions', task.index])
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
