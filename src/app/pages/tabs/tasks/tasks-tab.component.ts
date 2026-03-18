import { Component, OnInit, OnDestroy } from '@angular/core'
import { NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { Task } from '../../../shared/models/task'
import { TasksService } from '../../home/services/tasks.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LocKeys } from '../../../shared/enums/localisations'

@Component({
  selector: 'app-tasks-tab',
  templateUrl: 'tasks-tab.component.html',
  styleUrls: ['tasks-tab.component.scss']
})
export class TasksTabComponent implements OnInit, OnDestroy {
  sortedTasks: Promise<Map<any, any>>
  currentDate: number
  isTaskCalendarTaskNameShown: Promise<boolean>
  title: Promise<string>
  resumeListener: Subscription = new Subscription()

  constructor(
    public navCtrl: NavController,
    private tasksService: TasksService,
    private usage: UsageService,
    private alertService: AlertService,
    private localization: LocalizationService,
    private platform: Platform
  ) { }

  ngOnInit() {
    this.usage.setPage(this.constructor.name)
    this.platform.ready().then(() => {
      this.tasksService.init().then(() => this.init())
    })
  }

  ngOnDestroy() {
    if (this.resumeListener) {
      this.resumeListener.unsubscribe()
    }
  }

  ionViewWillEnter() {
    this.sortedTasks = this.tasksService.getValidTasksMap()
    this.resumeListener = this.platform.resume.subscribe(() => {
      this.sortedTasks = this.tasksService.getValidTasksMap()
    })
  }

  ionViewWillLeave() {
    if (this.resumeListener) {
      this.resumeListener.unsubscribe()
    }
  }

  init() {
    this.sortedTasks = this.tasksService.getValidTasksMap()
    this.isTaskCalendarTaskNameShown =
      this.tasksService.getIsTaskCalendarTaskNameShown()
    this.title = this.tasksService.getPlatformInstanceName()
    this.currentDate = this.tasksService.getCurrentDateMidnight().getTime()
  }

  startQuestionnaire(task: Task) {
    if (this.tasksService.isTaskStartable(task)) {
      if (task.name.toLowerCase().includes('healthkit')) {
        this.usage.sendClickEvent('start_healthkit')
        this.navCtrl.navigateForward('/healthkit', { state: task })
      } else {
        this.usage.sendClickEvent('start_questionnaire')
        this.navCtrl.navigateForward('/questions', { state: task })
      }
    } else {
      this.showMissedInfo()
    }
  }

  showMissedInfo() {
    return this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.CALENDAR_TASK_MISSED_TITLE),
      message: this.localization.translateKey(LocKeys.CALENDAR_TASK_MISSED_DESC),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY),
          handler: () => { }
        }
      ]
    })
  }
}
