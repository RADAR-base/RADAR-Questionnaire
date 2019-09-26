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
  currentPercentage: number = 0;
  stroke = 22
  animation = 'easeInQuart'
  animationDelay = 100
  duration = 300
  complete = false
  showFireworks: boolean = false

  ngOnChanges() {
    this.updateProgress()
  }

  updateProgress() {
    if (this.progress) {
      this.current = this.progress.completedTasks
      this.max = this.progress.numberOfTasks
      this.currentPercentage = this.progress.completedPercentage
    }
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
