import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild
} from '@angular/core'
import { AlertController, NavController, Platform } from 'ionic-angular'

import { DefaultTask } from '../../../assets/data/defaultConfig'
import { HomeController } from '../../providers/home-controller'
import { LocKeys } from '../../shared/enums/localisations'
import { Task } from '../../shared/models/task'
import { TranslatePipe } from '../../shared/pipes/translate/translate'

@Component({
  selector: 'task-calendar',
  templateUrl: 'task-calendar.html'
})
export class TaskCalendarComponent implements OnChanges {
  @Input()
  scrollHeight = 0
  @Output()
  task: EventEmitter<Task> = new EventEmitter<Task>()

  currentTime: String = '06:00'
  timeIndex = 0

  tasks: Task[] = [DefaultTask]

  constructor(
    private controller: HomeController,
    private alertCtrl: AlertController,
    private translate: TranslatePipe,
    private platform: Platform
  ) {
    this.getTasks()
    platform.resume.subscribe(e => {
      this.getTasks()
    })
  }

  ngOnChanges() {
    this.setCurrentTime()
  }

  getTasks() {
    this.controller.getTasksOfToday().then(tasks => {
      if (tasks) {
        this.tasks = tasks.sort(this.compareTasks)
      }
    })
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

  // Compare current time with the start times of the tasks and find
  // out in between which tasks it should be shown in the interface
  getCurrentTimeIndex(date: Date) {
    let tasksPassed = 0
    for (const task of this.tasks) {
      if (date.getTime() <= task.timestamp) {
        return tasksPassed
      } else {
        tasksPassed += 1
      }
    }
    return tasksPassed
  }

  formatTime(date) {
    const hour = date.getHours()
    const min = date.getMinutes()
    const hourStr = date.getHours() < 10 ? '0' + String(hour) : String(hour)
    const minStr = date.getMinutes() < 10 ? '0' + String(min) : String(min)
    return hourStr + ':' + minStr
  }

  // Define the order of the tasks - whether it is based on index or timestamp
  compareTasks(a: Task, b: Task) {
    if (a.timestamp < b.timestamp) {
      return -1
    }
    if (a.timestamp > b.timestamp) {
      return 1
    }
    return 0
  }

  hasExtraInfo(warningStr) {
    // console.log(warningStr)
    if (warningStr === '') {
      return false
    }
    return true
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
