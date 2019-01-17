import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'
import { AlertController } from 'ionic-angular'

import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'

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
  timeIndex: Promise<number>

  constructor(
    private alertCtrl: AlertController,
    private translate: TranslatePipe
  ) {}

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
    this.timeIndex = this.getCurrentTimeIndex(now)
  }

  // NOTE: Compare current time with the start times of the tasks and
  // find out in between which tasks it should be shown in the interface
  getCurrentTimeIndex(date: Date) {
    let tasksPassed = 0
    return Promise.resolve(
      this.tasks.then(tasks => {
        for (const task of tasks) {
          if (date.getTime() <= task.timestamp) {
            return tasksPassed
          } else {
            tasksPassed += 1
          }
        }
        return tasksPassed
      })
    )
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
    if (task.name !== 'ESM' && !task.completed) {
      this.task.emit(task)
    } else {
      const now = new Date()
      const nowPlusFifteen = new Date(now.getTime() + 1000 * 60 * 15)
      const taskTimestamp = new Date(task.timestamp)
      if (
        taskTimestamp > now &&
        taskTimestamp < nowPlusFifteen &&
        !task.completed
      ) {
        this.task.emit(task)
      } else {
        this.showESM_missedInfo()
      }
    }
  }

  showESM_missedInfo() {
    const buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {}
      }
    ]
    this.showAlert({
      title: this.translate.transform(
        LocKeys.CALENDAR_ESM_MISSED_TITLE.toString()
      ),
      message: this.translate.transform(
        LocKeys.CALENDAR_ESM_MISSED_DESC.toString()
      ),
      buttons: buttons
    })
  }

  showAlert(parameters) {
    const alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if (parameters.message) {
      alert.setMessage(parameters.message)
    }
    if (parameters.inputs) {
      for (let i = 0; i < parameters.inputs.length; i++) {
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }
}
