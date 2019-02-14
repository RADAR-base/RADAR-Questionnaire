import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { LocalizationService } from '../../../../core/services/localization.service'
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
  tasks: Promise<Map<any, any>>

  currentTime: string
  currentDate = new Date().setUTCHours(0, 0, 0, 0)
  timeIndex: Promise<number>

  constructor(private localization: LocalizationService) {}

  ngOnChanges() {
    this.setCurrentTime()
  }

  setCurrentTime() {
    const now = new Date().getTime()
    try {
      this.currentTime = this.localization.moment(now).format('LT') // locale time
    } catch (e) {
      console.log(e)
    }
    this.timeIndex = this.tasks.then(tasks => {
      const todaysTasks = tasks.get(new Date().setUTCHours(0, 0, 0, 0))
      const index = todaysTasks.findIndex(t => t.timestamp >= now)
      return index > -1 ? index : todaysTasks.length - 1
    })
  }

  clicked(task) {
    this.task.emit(task)
  }

  getStartTime(task: Task) {
    return this.localization.moment(task.timestamp).format('HH:mm')
  }
}
