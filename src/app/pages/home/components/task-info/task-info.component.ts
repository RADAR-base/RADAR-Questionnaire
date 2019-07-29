import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'

import { LocalizationService } from '../../../../core/services/localization.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task, TasksProgress } from '../../../../shared/models/task'
import { LogService } from '../../../../core/services/log.service'
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
      state('false', style({ transform: 'translate3d(-20%, 28%, 0)' })),
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
    trigger('scaleStatus', [
      state('false', style({ transform: 'scale(0.9)' })),
      transition('* => *', animate('400ms ease'))
    ]),
    trigger('moveInProgress', [
      state('true', style({ transform: 'translate3d(-150%, 0, 0)' })),
      state('false', style({ transform: 'translate3d(0, 0, 0)' })),
      transition('* => *', animate('350ms ease'))
    ]),
    trigger('alignCenterRightMetrics', [
      state('false', style({ transform: 'translate3d(105%, 0, 0)' })),
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
  expanded
  hasExtraInfo: boolean
  extraTaskInfo: string
  nextTaskStatus
  statusChanges: SimpleChanges

  max: number = 1
  current: number = 0
  radius: number = 35
  stroke: number = 8

  constructor(
    private localization: LocalizationService,
    private logger: LogService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    this.logger.log(this.task)
    this.updateProgress()
    this.updateNextTaskStatus()
    this.statusChanges = changes
  }

  updateProgress() {
    if (this.progress) {
      this.current = this.progress.completedTasks
      this.max = this.progress.numberOfTasks
    }
  }

  getHour() {
    return this.localization.moment(this.task.timestamp).format('HH')
  }

  getMinutes() {
    return this.localization.moment(this.task.timestamp).format('mm')
  }

  getMeridiem() {
    const date = new Date()
    date.setTime(this.task['timestamp'])
    const hour = date.getHours()
    const meridiem = hour >= 12 ? 'PM' : 'AM'
    return meridiem
  }

  updateNextTaskStatus() {
    this.nextTaskStatus = this.isNow
      ? this.localization.translateKey(LocKeys.STATUS_NOW)
      : this.task.name !== 'ESM'
      ? ''
      : this.localization.translateKey(LocKeys.TASK_BAR_NEXT_TASK_SOON)
  }
}
