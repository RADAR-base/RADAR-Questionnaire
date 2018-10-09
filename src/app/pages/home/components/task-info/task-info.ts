import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from '@angular/animations'
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { HomeController } from '../../../../providers/home-controller'
import { StorageService } from '../../../../providers/storage-service'
import { StorageKeys } from '../../../../shared/enums/storage'
import { Task, TasksProgress } from '../../../../shared/models/task'
import { checkTaskIsNow } from '../../../../shared/utilities/check-task-is-now'

/**
 * Generated class for the TaskInfo component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'task-info',
  templateUrl: 'task-info.html',
  animations: [
    trigger('fade', [
      state(
        'out',
        style({
          opacity: '0'
        })
      ),
      state(
        'in',
        style({
          opacity: '1.0'
        })
      ),
      transition('in => out', animate('400ms ease')),
      transition('out => in', animate('400ms ease'))
    ]),
    trigger('scaleMinutes', [
      state(
        'min',
        style({
          transform: 'translate3d(-25%, -15%, 0) scale(0.45)'
        })
      ),
      state(
        'max',
        style({
          transform: 'translate3d(0, 0, 0) scale(1)'
        })
      ),
      transition('max => min', animate('400ms ease')),
      transition('min => max', animate('400ms ease'))
    ]),
    trigger('alignCenterRightExtraInfo', [
      state(
        'right',
        style({
          transform: 'translate3d(15%, 0, 0)'
        })
      ),
      state(
        'center',
        style({
          transform: 'translate3d(0, 0, 0)'
        })
      ),
      transition('center => right', animate('400ms ease')),
      transition('right => center', animate('400ms ease'))
    ]),
    trigger('alignCenterRightTime', [
      state(
        'right',
        style({
          transform: 'translate3d(5%, 0, 0)'
        })
      ),
      state(
        'center',
        style({
          transform: 'translate3d(0, 0, 0)'
        })
      ),
      transition('center => right', animate('400ms ease')),
      transition('right => center', animate('400ms ease'))
    ]),
    trigger('moveInProgress', [
      state(
        'out',
        style({
          display: 'none',
          transform: 'translate3d(-150%, 0, 0)'
        })
      ),
      state(
        'in',
        style({
          display: 'block',
          transform: 'translate3d(0, 0, 0)'
        })
      ),
      transition('out => in', animate('400ms ease')),
      transition('in => out', animate('400ms ease'))
    ]),
    trigger('alignCenterRightMetrics', [
      state(
        'right',
        style({
          transform: 'translate3d(150%, 0, 0)'
        })
      ),
      state(
        'center',
        style({
          transform: 'translate3d(0, 0, 0)'
        })
      ),
      transition('center => right', animate('400ms ease')),
      transition('right => center', animate('400ms ease'))
    ])
  ]
})
export class TaskInfoComponent implements OnChanges {
  @Input()
  task: Task
  @Output()
  collapse: EventEmitter<Boolean> = new EventEmitter()
  expanded: Boolean = true
  hasExtraInfo: Boolean = false
  displayTask: Boolean = false
  animateFade: String
  animateMove: String
  animateScale: String
  animateCenterRight: String
  isNow: boolean = false
  private language: string

  max: number = 1
  current: number = 0
  radius: number = 38
  stroke: number = 8
  progress: TasksProgress

  animationKeys = {
    MIN: 'min',
    MAX: 'max',
    IN: 'in',
    OUT: 'out',
    CENTER: 'center',
    RIGHT: 'right'
  }

  constructor(
    private controller: HomeController,
    public storage: StorageService
  ) {
    this.applyAnimationKeys()
    setInterval(() => {
      this.isNow = checkTaskIsNow(this.task.timestamp)
    }, 1000)

    this.storage.get(StorageKeys.LANGUAGE).then(resLang => {
      this.language = resLang.value
    })
  }

  ngOnChanges(changes) {
    if (this.task['timestamp'] > 0) {
      this.displayTask = true
    } else {
      this.displayTask = false
    }
    if (this.task['warning'] !== '') {
      this.hasExtraInfo = true
    } else {
      this.hasExtraInfo = false
    }
  }

  expand() {
    if (this.task.name !== 'ESM') {
      this.collapse.emit(this.expanded)
      this.expanded = !this.expanded
      this.applyAnimationKeys()
      this.updateProgress()
    }
  }

  updateProgress() {
    this.controller.getTaskProgress().then(progress => {
      this.progress = progress
      if (this.progress) {
        this.current = this.progress.completedTasks
        this.max = this.progress.numberOfTasks
      }
    })
  }

  applyAnimationKeys() {
    if (this.expanded) {
      this.animateFade = this.animationKeys.IN
      this.animateMove = this.animationKeys.OUT
      this.animateScale = this.animationKeys.MAX
      this.animateCenterRight = this.animationKeys.CENTER
    } else {
      this.animateFade = this.animationKeys.OUT
      this.animateMove = this.animationKeys.IN
      this.animateScale = this.animationKeys.MIN
      this.animateCenterRight = this.animationKeys.RIGHT
    }
  }

  getHour() {
    const date = new Date()
    date.setTime(this.task['timestamp'])
    const hour = date.getHours()
    // let hour12 = hour > 12 ? hour-12 : hour
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

  getExtraInfo(): string {
    if (this.language) {
      const info = this.task.warning[this.language]
      this.hasExtraInfo = info !== '' ? true : false
      return info
    } else {
      this.hasExtraInfo = false
      return ''
    }
  }
}
