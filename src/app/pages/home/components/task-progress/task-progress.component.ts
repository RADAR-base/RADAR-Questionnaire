import { Component, Input, OnChanges } from '@angular/core'

import { TasksProgress } from '../../../../shared/models/task'
import { TaskProgressAnimations } from './task-progress.animation'
import confetti from 'canvas-confetti';

@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.component.html',
  animations: TaskProgressAnimations,
  styleUrls: ['./task-progress.component.scss']
})
export class TaskProgressComponent implements OnChanges {
  @Input()
  progress: TasksProgress
  @Input()
  forceComplete = false
  @Input()
  noTasksToday = false
  @Input()
  streakDays = 0

  max: number = 1
  current: number = 0
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
    }
    this.complete = this.forceComplete || this.current >= this.max
    if (this.complete && !this.showFireworks) {
      this.displayFireworks()
      this.showFireworks = true
    }
  }

  displayFireworks() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }
}
