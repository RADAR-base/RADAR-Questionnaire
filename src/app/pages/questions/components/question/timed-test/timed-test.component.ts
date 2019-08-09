import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core'
import { BackgroundMode } from '@ionic-native/background-mode/ngx'
import { Dialogs } from '@ionic-native/dialogs/ngx'
import { Vibration } from '@ionic-native/vibration/ngx'

import { TaskTimer, Timer } from '../../../../../shared/models/timer'
import {
  getMilliseconds,
  getSeconds
} from '../../../../../shared/utilities/time'

@Component({
  selector: 'timed-test',
  templateUrl: 'timed-test.component.html'
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

  constructor(
    private dialogs: Dialogs,
    private vibration: Vibration,
    private background: BackgroundMode
  ) {}

  ngOnInit() {
    this.background.enable()
    this.initTimer()
  }

  ngOnDestroy() {
    this.background.disable()
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
    this.background.moveToForeground()
    this.dialogs.beep(1)
    this.vibration.vibrate(500)
    this.taskTimer.hasFinished = true
    this.valueChange.emit(this.endTime)
  }
}
