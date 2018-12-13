import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'

import { StorageService } from '../../../../core/services/storage.service'
import { StorageKeys } from '../../../../shared/enums/storage'
import { Task, TasksProgress } from '../../../../shared/models/task'
import { TasksService } from '../../services/tasks.service'

/**
 * Generated class for the TaskInfo component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'task-info',
  templateUrl: 'task-info.component.html',
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
          transform: 'translate3d(15%, 0, 0) scale(0.8)'
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
          transform: 'translate3d(120%, 0, 0)'
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
  @Input()
  isNow = false
  @Input()
  progress: TasksProgress
  @Output()
  collapse: EventEmitter<Boolean> = new EventEmitter()
  expanded: Boolean = true
  hasExtraInfo: Boolean = false
  displayTask: Boolean = false
  animateFade: String
  animateMove: String
  animateScale: String
  animateCenterRight: String

  private language: string
  private extraTaskInfo: string

  max: number = 1
  current: number = 0
  radius: number = 35
  stroke: number = 8

  animationKeys = {
    MIN: 'min',
    MAX: 'max',
    IN: 'in',
    OUT: 'out',
    CENTER: 'center',
    RIGHT: 'right'
  }

  constructor(
    private tasksService: TasksService,
    public storage: StorageService
  ) {
    this.applyAnimationKeys()
    this.storage.get(StorageKeys.LANGUAGE).then(resLang => {
      this.language = resLang.value
    })
  }

  ngOnChanges() {
    this.checkDisplayTask()
    this.checkHasExtraInfo()
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

  expand() {
    if (this.task.name !== 'ESM') {
      this.collapse.emit(this.expanded)
      this.expanded = !this.expanded
      this.applyAnimationKeys()
      this.updateProgress()
    }
  }

  updateProgress() {
    if (this.progress) {
      this.current = this.progress.completedTasks
      this.max = this.progress.numberOfTasks
    }
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
