import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { Task } from '../../../../shared/models/task'
import { formatTime } from '../../../../shared/utilities/time'

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
    if (this.tasks && this.tasks.size) this.setCurrentTime()
  }

  getStartTime(task: Task) {
    return formatTime(new Date(task.timestamp))
  }

  setCurrentTime() {
    const now = new Date()
    this.currentTime = formatTime(now)

    // NOTE: Compare current time with the start times of the tasks and
    // find out in between which tasks it should be shown in the interface
    const todaysTasks = this.tasks.get(this.currentDate)
    this.timeIndex = todaysTasks.findIndex(t => t.timestamp >= now.getTime())
  }

  hasExtraInfo(warningStr) {
    return warningStr !== ''
  }

  clicked(task) {
    this.task.emit(task)
  }
}
