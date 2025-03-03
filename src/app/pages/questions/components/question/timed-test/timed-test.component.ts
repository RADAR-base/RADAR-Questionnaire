import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
// import { Plugins } from '@capacitor/core'
import { Dialog } from '@capacitor/dialog'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

import { TaskTimer, Timer } from '../../../../../shared/models/timer'
import {
  getMilliseconds,
  getSeconds
} from '../../../../../shared/utilities/time'

// const { App, BackgroundTask } = Plugins

@Component({
  selector: 'timed-test',
  templateUrl: 'timed-test.component.html',
  styleUrls: ['timed-test.component.scss'],
})
export class TimedTestComponent implements OnInit, OnChanges, OnDestroy {
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
  startTime: number
  endTime: number

  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.initTimer()
  }

  ngOnDestroy() {}

  ngOnChanges() {
    if (this.currentlyShown) {
      this.startTimer()
    }
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

    this.taskTimer = {
      hasStarted: false,
      hasFinished: false,
      secondsElapsed: 0,
      secondsRemaining: this.timer.start,
      duration: this.timer.start - this.timer.end,
      displayTime: this.timer.start
    }
  }

  startTimer() {
    this.taskTimer.hasStarted = true
    this.startTime = Date.now()
    this.endTime =
      this.startTime + getMilliseconds({ seconds: this.taskTimer.duration })
    this.timerTick()
  }

  updateCountdown() {
    this.taskTimer.secondsElapsed = Math.floor(
      getSeconds({
        milliseconds: Date.now() - this.startTime
      })
    )
    this.taskTimer.displayTime =
      this.timer.start - this.taskTimer.secondsElapsed
    this.ref.markForCheck()
  }

  timerTick() {
    if (!this.taskTimer.hasStarted) {
      return
    }
    const timerId = setInterval(() => {
      this.updateCountdown()

      if (this.endTime - Date.now() <= 0) {
        clearInterval(timerId)
        this.stopTimer()
      }
    }, 1000)
  }

  stopTimer() {
    Haptics.vibrate()
    this.taskTimer.hasFinished = true
    this.valueChange.emit(this.endTime)
  }
}
