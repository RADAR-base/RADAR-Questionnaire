import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'
import { AlertController, Platform } from 'ionic-angular'

import { DefaultTask } from '../../../../../assets/data/defaultConfig'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { TasksService } from '../../services/tasks.service'
import {AlertService} from "../../../../core/services/alert.service";

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
    private translate: TranslatePipe,
    private platform: Platform
  ) {}

  ngOnChanges() {
    this.setCurrentTime()
  }

  static getStartTime(task: Task) {
    return TaskCalendarComponent.formatTime(new Date(task.timestamp))
  }

  setCurrentTime() {
    const now = new Date()
    this.currentTime = TaskCalendarComponent.formatTime(now)
    this.timeIndex = this.getCurrentTimeIndex(now)
  }

  // NOTE: Compare current time with the start times of the tasks and
  // find out in between which tasks it should be shown in the interface
  getCurrentTimeIndex(date: Date): Promise<number> {
    return this.tasks.then(tasks =>
      tasks.findIndex(t => t.timestamp >= date.getTime()))
  }

  static formatTime(date) {
    const hour = date.getHours()
    const min = date.getMinutes()
    const hourStr = hour < 10 ? '0' + String(hour) : String(hour)
    const minStr = min < 10 ? '0' + String(min) : String(min)
    return hourStr + ':' + minStr
  }

  static hasExtraInfo(warningStr) {
    return warningStr !== ''
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
      title: this.translate.transform(
        LocKeys.CALENDAR_ESM_MISSED_TITLE.toString()
      ),
      message: this.translate.transform(
        LocKeys.CALENDAR_ESM_MISSED_DESC.toString()
      ),
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {}
        }
      ]
    })
  }
}
