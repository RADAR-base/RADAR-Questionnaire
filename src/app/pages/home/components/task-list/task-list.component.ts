import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { TasksService } from '../../services/tasks.service'
import { AlertService } from "../../../../core/services/misc/alert.service";
import { LocalizationService } from "../../../../core/services/misc/localization.service";
import {LogService} from "../../../../core/services/misc/log.service";

@Component({
  selector: 'task-list',
  templateUrl: 'task-list.component.html'
})
export class TaskListComponent implements OnChanges {

  @Input()
  tasks: Task[]

  // @Input()
  // tasks: Map<number, Task[]>

  @Output()
  task: EventEmitter<Task> = new EventEmitter<Task>()

  @Input()
  currentDate: number

  currentTime
  timeIndex: number

  constructor(
    private tasksService: TasksService,
    private alertService: AlertService,
    private localization: LocalizationService,
    private logger: LogService
  ) {}

  ngOnChanges() {
    if (this.tasks && this.tasks.length) this.setCurrentTime()
    // if (this.tasks && this.tasks.size) this.setCurrentTime()
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
    // const todaysTasks = this.tasks.get(this.currentDate)
    // this.timeIndex = todaysTasks.findIndex(t => t.timestamp >= now)
  }

  clicked(task) {
    this.task.emit(task)
  }

  getStartTime(task: Task) {
    return this.localization.moment(task.timestamp).format('HH:mm')
  }

}
