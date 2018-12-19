import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'

import { AlertService } from '../../../../core/services/alert.service'
import { LocalizationService } from '../../../../core/services/localization.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { TasksService } from '../../services/tasks.service'

@Component({
  selector: 'task-calendar',
  templateUrl: 'task-calendar.component.html'
})
export class TaskCalendarComponent implements OnChanges {
  @Input()
  scrollHeight = 0
  @Output()
  task: EventEmitter<Task> = new EventEmitter<Task>()
  @Input()
  tasks: Promise<Task[]>

  currentTime: string
  timeIndex: Promise<number>

  constructor(
    private tasksService: TasksService,
    private alertService: AlertService,
    private localization: LocalizationService,
  ) {}

  ngOnChanges() {
    this.setCurrentTime()
  }

  setCurrentTime() {
    try {
      this.currentTime = this.localization.moment().format('LT') // locale time
    } catch (e) {
      console.log(e)
    }

    const now = new Date().getTime()
    this.timeIndex = this.tasks
      .then(tasks => tasks.findIndex(t => t.timestamp >= now))
  }

  clicked(task) {
    const now = new Date().getTime()
    if (
      task.timestamp >= now &&
      task.timestamp < now + task.completionWindow &&
      !task.completed
    ) {
      this.task.emit(task)
    } else {
      return this.showMissedInfo()
    }
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

  getStartTime(task: Task) {
    return this.localization.moment(task.timestamp)
      .format('LT')
  }
}
