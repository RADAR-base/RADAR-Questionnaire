import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core'
import { Dialogs } from '@ionic-native/dialogs'
import { Vibration } from '@ionic-native/vibration'

import { TaskTimer, Timer } from '../../../../../shared/models/timer'

@Component({
  selector: 'timed-test',
  templateUrl: 'timed-test.component.html'
})
export class TimedTestComponent implements OnInit, OnChanges {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()
  @Input()
  heading: string
  @Input()
  image: string
  @Input()
  timer: Timer
  @Input()
  currentlyShown: boolean
  public taskTimer: TaskTimer

  constructor(private dialogs: Dialogs, private vibration: Vibration) {}

  ngOnInit() {
    this.initTimer()
  }

  ngOnChanges() {
    if (this.currentlyShown) {
      this.start()
    }
  }

  start() {
    if (this.taskTimer.hasStarted) {
      this.resumeTimer()
    } else {
      this.startTimer()
    }
  }

  emitTime(emitter) {
    const epoch: number = new Date().getTime()
    emitter.emit(epoch)
  }

  hasFinished() {
    return this.taskTimer.hasFinished
  }

  hasStarted() {
    return this.taskTimer.hasStarted
  }

  initTimer() {
    if (!this.timer) {
      this.timer.start = 0
    }

    this.taskTimer = <TaskTimer>{
      seconds: this.timer.start,
      runTimer: false,
      hasStarted: false,
      hasFinished: false,
      secondsRemaining: this.timer.start
    }

    this.taskTimer.displayTime = this.taskTimer.secondsRemaining.toString()
  }

  startTimer() {
    this.taskTimer.hasStarted = true
    this.taskTimer.runTimer = true
    this.timerTick()
  }

  pauseTimer() {
    this.taskTimer.runTimer = false
  }

  resumeTimer() {
    this.startTimer()
  }

  timerTick() {
    setTimeout(() => {
      if (!this.taskTimer.runTimer) {
        return
      }
      if (this.taskTimer.secondsRemaining > 0) {
        this.taskTimer.secondsRemaining--
        this.taskTimer.displayTime = this.taskTimer.secondsRemaining.toString()
        if (this.taskTimer.secondsRemaining > this.timer.end) {
          this.timerTick()
        } else {
          this.dialogs.beep(1)
          this.vibration.vibrate(600)

          if (this.timer.end === 0) {
            this.taskTimer.hasFinished = true
          } else {
            this.pauseTimer()
          }
          // NOTE: save timestamp (epoch) and activate the next button
          this.emitTime(this.valueChange)
        }
      }
    }, 1000)
  }
}
