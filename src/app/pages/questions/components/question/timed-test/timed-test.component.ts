import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core'
import { Dialogs } from '@ionic-native/dialogs/ngx'
import { Vibration } from '@ionic-native/vibration/ngx'

import { TaskTimer, Timer } from '../../../../../shared/models/timer'
import { getSeconds } from '../../../../../shared/utilities/time'

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
  startTime
  endTime

  constructor(private dialogs: Dialogs, private vibration: Vibration) {}

  ngOnInit() {
    this.initTimer()
  }

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
    this.endTime = this.startTime + this.taskTimer.duration * 1000
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
  }

  timerTick() {
    if (!this.taskTimer.hasStarted) {
      return
    }
    setTimeout(() => {
      this.updateCountdown()
      if (this.endTime - Date.now()) this.timerTick()
      else this.finishTimer()
    }, 500)
  }

  finishTimer() {
    this.dialogs.beep(1)
    this.vibration.vibrate(500)
    this.taskTimer.hasFinished = true
    this.valueChange.emit(Date.now())
  }
}
