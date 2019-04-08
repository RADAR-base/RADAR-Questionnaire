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
  tasks: Map<number, Task[]>
  @Input()
  currentDate: number

  currentTime
  timeIndex: number

  constructor() {}

  ngOnChanges() {
    if (this.tasks) this.setCurrentTime()
  }

  getStartTime(task: Task) {
    return TaskCalendarComponent.formatTime(new Date(task.timestamp))
  }

  setCurrentTime() {
    const now = new Date()
    this.currentTime = TaskCalendarComponent.formatTime(now)

    // NOTE: Compare current time with the start times of the tasks and
    // find out in between which tasks it should be shown in the interface
    const todaysTasks = this.tasks.get(this.currentDate)
    this.timeIndex = todaysTasks.findIndex(t => t.timestamp >= now.getTime())
  }

  static formatTime(date) {
    const hour = date.getHours()
    const min = date.getMinutes()
    const hourStr = hour < 10 ? '0' + String(hour) : String(hour)
    const minStr = min < 10 ? '0' + String(min) : String(min)
    return hourStr + ':' + minStr
  }

  hasExtraInfo(warningStr) {
    return warningStr !== ''
  }

  clicked(task) {
    this.task.emit(task)
  }
}
