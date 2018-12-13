import { animate, state, style, transition, trigger } from '@angular/animations'
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { StorageService } from '../../../../core/services/storage.service'
import { StorageKeys } from '../../../../shared/enums/storage'
import { Task, TasksProgress } from '../../../../shared/models/task'

@Component({
  selector: 'task-info',
  templateUrl: 'task-info.component.html',
  animations: [
    trigger('fade', [
      state('false', style({ opacity: '0' })),
      state('true', style({ opacity: '1.0' })),
      transition('* => *', animate('400ms ease'))
    ]),
    trigger('scaleMinutes', [
      state(
        'false',
        style({ transform: 'translate3d(-25%, -15%, 0) scale(0.45)' })
      ),
      state('true', style({ transform: 'translate3d(0, 0, 0) scale(1)' })),
      transition('* => *', animate('400ms ease'))
    ]),
    trigger('alignCenterRightExtraInfo', [
      state('false', style({ transform: 'translate3d(15%, 0, 0)' })),
      state('true', style({ transform: 'translate3d(0, 0, 0)' })),
      transition('* => *', animate('400ms ease'))
    ]),
    trigger('alignCenterRightTime', [
      state('false', style({ transform: 'translate3d(15%, 0, 0) scale(0.8)' })),
      state('true', style({ transform: 'translate3d(0, 0, 0)' })),
      transition('* => *', animate('400ms ease'))
    ]),
    trigger('moveInProgress', [
      state(
        'true',
        style({ display: 'none', transform: 'translate3d(-150%, 0, 0)' })
      ),
      state(
        'false',
        style({ display: 'block', transform: 'translate3d(0, 0, 0)' })
      ),
      transition('* => *', animate('400ms ease'))
    ]),
    trigger('alignCenterRightMetrics', [
      state('false', style({ transform: 'translate3d(120%, 0, 0)' })),
      state('true', style({ transform: 'translate3d(0, 0, 0)' })),
      transition('* => *', animate('400ms ease'))
    ])
  ]
})
export class TaskInfoComponent implements OnChanges {
  @Input()
  task: Task
  @Input()
  isNow = false
  @Input()
  progress: TasksProgress
  @Input()
  expanded = true
  hasExtraInfo: Boolean = false
  displayTask: Boolean = false

  private language: string
  private extraTaskInfo: string

  max: number = 1
  current: number = 0
  radius: number = 35
  stroke: number = 8

  constructor(public storage: StorageService) {
    this.storage.get(StorageKeys.LANGUAGE).then(resLang => {
      this.language = resLang.value
    })
  }

  ngOnChanges() {
    this.checkDisplayTask()
    this.checkHasExtraInfo()
    this.updateProgress()
  }

  checkDisplayTask() {
    if (this.task['timestamp'] > 0) {
      this.displayTask = true
    } else {
      this.displayTask = false
    }
  }

  checkHasExtraInfo() {
    if (this.task['warning'] !== '') {
      this.hasExtraInfo = true
      if (this.language) {
        this.extraTaskInfo = this.task.warning[this.language]
        this.hasExtraInfo = this.extraTaskInfo ? true : false
      }
    } else {
      this.hasExtraInfo = false
    }
  }

  updateProgress() {
    if (this.progress) {
      this.current = this.progress.completedTasks
      this.max = this.progress.numberOfTasks
    }
  }

  getHour() {
    const date = new Date()
    date.setTime(this.task['timestamp'])
    const hour = date.getHours()
    const formatedHour = this.formatSingleDigits(hour)
    return formatedHour
  }

  getMinutes() {
    const date = new Date()
    date.setTime(this.task['timestamp'])
    const formatedMinutes = this.formatSingleDigits(date.getMinutes())
    return formatedMinutes
  }

  getMeridiem() {
    const date = new Date()
    date.setTime(this.task['timestamp'])
    const hour = date.getHours()
    const meridiem = hour >= 12 ? 'PM' : 'AM'
    return meridiem
  }

  formatSingleDigits(numberToFormat) {
    const format =
      numberToFormat < 10
        ? '0' + String(numberToFormat)
        : String(numberToFormat)
    return format
  }

  getExtraInfo() {
    return this.extraTaskInfo
  }
}
