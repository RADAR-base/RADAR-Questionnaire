import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, Input, OnChanges } from '@angular/core'

import { TasksProgress } from '../../../../shared/models/task'

@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.component.html',
  animations: [
    trigger('enterAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('translateY', [
      state('true', style({ transform: 'translateY(32vh)', opacity: 1 })),
      state('false', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('true <=> false', animate('1s linear'))
    ])
  ]
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
  animation = 'easeInOutQuart'
  complete = false
  showFireworks: boolean = false

  ngOnChanges() {
    this.current = this.progress.completedTasks
    this.max = this.progress.numberOfTasks
    this.currentPercentage = this.progress.completedPercentage
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
