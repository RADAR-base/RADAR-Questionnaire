import { Component, Input, OnChanges } from '@angular/core'

import { TasksProgress } from '../../../../shared/models/task'
import { TaskProgressAnimations } from './task-progress.animation'

@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.component.html',
  animations: TaskProgressAnimations
})
export class TaskProgressComponent implements OnChanges {
  @Input()
  progress: TasksProgress
  @Input()
  forceComplete = false
  @Input()
  noTasksToday = false

  max: number = 1
  current: number = 0
  stroke = 22
  animation = 'easeInOutQuart'
  complete = false
  showFireworks: boolean = false

  ngOnChanges() {
    this.current = this.progress.completedTasks
    this.max = this.progress.numberOfTasks
    this.updateProgress()
  }

  updateProgress() {
    this.complete = this.forceComplete || this.current >= this.max
    if (this.complete) this.displayFireworks(800, 980)
  }

  displayFireworks(milliDelay, milliDisplay) {
    setTimeout(() => {
      this.showFireworks = true
      setTimeout(() => (this.showFireworks = false), milliDisplay)
    }, milliDelay)
  }
}
