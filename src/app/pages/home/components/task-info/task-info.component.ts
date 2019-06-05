import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, Input, OnChanges } from '@angular/core'

import { StorageService } from '../../../../core/services/storage.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { StorageKeys } from '../../../../shared/enums/storage'
import { Task, TasksProgress } from '../../../../shared/models/task'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'

@Component({
  selector: 'task-info',
  templateUrl: 'task-info.component.html',
  animations: [
    trigger('fade', [
      state('false', style({ opacity: '0' })),
      state('true', style({ opacity: '1.0' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('scaleMinutes', [
      state(
        'false',
        style({ transform: 'translate3d(48%, -15%, 0) scale(0.45)' })
      ),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('rotateMeridiem', [
      state('true', style({ transform: 'rotate(90deg)' })),
      state('false', style({ transform: 'translate3d(-24%, 50%, 0)' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('moveHour', [
      state('false', style({ transform: 'translate3d(90%, 0, 0)' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('alignCenterRightExtraInfo', [
      state('false', style({ transform: 'translate3d(8vw, 0, 0) scale(0.8)' })),
      state('true', style({ transform: 'translate3d(0, 0, 0)' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('alignCenterRightTime', [
      state('false', style({ transform: 'scale(0.9)' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('moveInProgress', [
      state('true', style({ transform: 'translate3d(-150%, 0, 0)' })),
      state('false', style({ transform: 'translate3d(0, 0, 0)' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('alignCenterRightMetrics', [
      state('false', style({ transform: 'translate3d(115%, 0, 0)' })),
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
  hasExtraInfo: boolean
  extraTaskInfo: string
  nextTaskStatus
  statusSize

  private language: string

  max: number = 1
  current: number = 0
  radius: number = 35
  stroke: number = 8

  constructor(
    public storage: StorageService,
    private translate: TranslatePipe
  ) {
    this.storage.get(StorageKeys.LANGUAGE).then(resLang => {
      this.language = resLang.value
    })
  }

  ngOnChanges() {
    this.checkHasExtraInfo()
    this.updateProgress()
    this.updateNextTaskStatus()
  }

  checkHasExtraInfo() {
    this.hasExtraInfo = !!this.task.warning[this.language]
    this.extraTaskInfo = this.task.warning[this.language]
  }

  updateProgress() {
    if (this.progress) {
      this.current = this.progress.completedTasks
      this.max = this.progress.numberOfTasks
    }
  }

  getStatusScale() {}

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

  updateNextTaskStatus() {
    this.nextTaskStatus = this.translate.transform(
      this.isNow
        ? LocKeys.STATUS_NOW.toString()
        : this.task.name !== 'ESM'
        ? ''
        : LocKeys.TASK_BAR_NEXT_TASK_SOON.toString()
    )
    if (this.nextTaskStatus.length > 4) return (this.statusSize = 11)
    return (this.statusSize = 14)
  }
}
