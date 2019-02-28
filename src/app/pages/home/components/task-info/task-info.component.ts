import { Component, Input, OnChanges } from '@angular/core'

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
  expanded = true
  hasExtraInfo: boolean
  extraTaskInfo: string
  nextTaskStatus
  statusSize

  max: number = 1
  current: number = 0
  radius: number = 35
  stroke: number = 8

  constructor(private localization: LocalizationService) {}

  ngOnChanges() {
    this.updateProgress()
    this.updateNextTaskStatus()
  }

  updateProgress() {
    if (this.progress) {
      this.current = this.progress.completedTasks
      this.max = this.progress.numberOfTasks
    }
  }

  getStatusScale() {}

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

    if (this.nextTaskStatus.length > 7) return (this.statusSize = 8)
    if (this.nextTaskStatus.length > 4) return (this.statusSize = 11)
    return (this.statusSize = 14)
  }
}
