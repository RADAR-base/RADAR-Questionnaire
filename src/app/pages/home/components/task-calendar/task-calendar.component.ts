import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import moment from 'moment'

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
  tasks

  currentTime
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
    const now = new Date()
    this.currentTime = moment().format('LT') // locale time
    this.timeIndex = this.getCurrentTimeIndex(now)
  }

  // NOTE: Compare current time with the start times of the tasks and
  // find out in between which tasks it should be shown in the interface
  getCurrentTimeIndex(date: Date): Promise<number> {
    return this.tasks.then(tasks =>
      tasks.findIndex(t => t.timestamp >= date.getTime())
    )
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
}
