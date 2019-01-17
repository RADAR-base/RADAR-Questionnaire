import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, Input, OnChanges } from '@angular/core'

import { LocalizationService } from '../../../../core/services/localization.service'
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
        style({ transform: 'translate3d(-25%, -15%, 0) scale(0.4)' })
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
      state('false', style({ transform: 'translate3d(8%, 0, 0) scale(0.8)' })),
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

  max: number = 1
  current: number = 0
  radius: number = 35
  stroke: number = 8

  constructor(private localization: LocalizationService) {}

  ngOnChanges() {
    this.updateProgress()
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
}
