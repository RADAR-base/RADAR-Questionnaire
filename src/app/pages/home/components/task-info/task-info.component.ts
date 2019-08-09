import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task, TasksProgress } from '../../../../shared/models/task'
import { TaskInfoAnimations } from './task-info.animation'

@Component({
  selector: 'task-info',
  templateUrl: 'task-info.component.html',
  animations: TaskInfoAnimations
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

  constructor(private localization: LocalizationService) {}

  ngOnChanges(changes: SimpleChanges) {
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
