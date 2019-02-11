import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { Task } from '../../../../shared/models/task'

@Component({
  selector: 'task-calendar',
  templateUrl: 'task-calendar.component.html'
})
export class TaskCalendarComponent implements OnChanges {
  @Input()
  show = false
  @Output()
  task: EventEmitter<Task> = new EventEmitter<Task>()
  @Input()
  tasks

  currentTime
  currentDate = new Date().setUTCHours(0, 0, 0, 0)
  timeIndex: Promise<number>

  constructor() {}

  ngOnChanges() {
    this.setCurrentTime()
  }

  getStartTime(task: Task) {
    const date = new Date(task.timestamp)
    return this.formatTime(date)
  }

  setCurrentTime() {
    const now = new Date()
    this.currentTime = this.formatTime(now)

    // NOTE: Compare current time with the start times of the tasks and
    // find out in between which tasks it should be shown in the interface
    this.timeIndex = this.tasks.then(tasks => {
      const index = tasks
        .get(new Date().setUTCHours(0, 0, 0, 0))
        .findIndex(t => t.timestamp >= now.getTime())
      return index > -1 ? index : tasks.length - 1
    })
  }

  formatTime(date) {
    const hour = date.getHours()
    const min = date.getMinutes()
    const hourStr = date.getHours() < 10 ? '0' + String(hour) : String(hour)
    const minStr = date.getMinutes() < 10 ? '0' + String(min) : String(min)
    return hourStr + ':' + minStr
  }

  hasExtraInfo(warningStr) {
    return warningStr !== ''
  }

  clicked(task) {
    this.task.emit(task)
  }
}
