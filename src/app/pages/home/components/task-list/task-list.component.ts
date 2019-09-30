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

@Component({
  selector: 'task-list',
  templateUrl: 'task-list.component.html'
})
export class TaskListComponent implements OnChanges {

  @Input()
  tasks : Promise<Task[]>;

  @Output()
  task: EventEmitter<Task> = new EventEmitter<Task>()

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
      task.timestamp <= now &&
      task.timestamp + task.completionWindow > now &&
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
