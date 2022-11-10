import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { LogService } from '../../../../core/services/misc/log.service'
import { Task } from '../../../../shared/models/task'
import { setDateTimeToMidnight } from '../../../../shared/utilities/time'

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
  isTaskNameShown: boolean

  currentTime
  timeIndex: number

  constructor(
    private localization: LocalizationService,
    private logger: LogService
  ) {}

  ngOnChanges() {
    if (this.tasks && this.tasks.size) this.setCurrentTime()
  }

  setCurrentTime() {
    const now = new Date().getTime()
    try {
      this.currentTime = this.localization.moment(now).format('LT') // locale time
    } catch (e) {
      this.logger.error('Failed to set current time', e)
    }
    // NOTE: Compare current time with the start times of the tasks and
    // find out in between which tasks it should be shown in the interface
    const todaysTasks = this.tasks.get(
      setDateTimeToMidnight(new Date()).getTime()
    )
    if (todaysTasks)
      this.timeIndex = todaysTasks.findIndex(t => t.timestamp >= now)
  }

  clicked(task) {
    this.task.emit(task)
  }

  getStartTime(task: Task) {
    return this.localization.moment(task.timestamp).format('HH:mm')
  }
}
