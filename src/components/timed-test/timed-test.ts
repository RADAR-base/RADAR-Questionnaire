import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core'
import { Dialogs } from '@ionic-native/dialogs'
import { Vibration } from '@ionic-native/vibration'

const uniqueID = 0

export interface Timer {
  start: number
  end: number
}

export interface ITimer {
  seconds: number
  secondsRemaining: number
  runTimer: boolean
  hasStarted: boolean
  hasFinished: boolean
  displayTime: string
}

@Component({
  selector: 'timed-test',
  templateUrl: 'timed-test.html'
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
  public itimer: ITimer

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
    if (this.itimer.hasStarted) {
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
    return this.itimer.hasFinished
  }

  hasStarted() {
    return this.itimer.hasStarted
  }

  initTimer() {
    if (!this.timer) {
      this.timer.start = 0
    }

    this.itimer = <ITimer>{
      seconds: this.timer.start,
      runTimer: false,
      hasStarted: false,
      hasFinished: false,
      secondsRemaining: this.timer.start
    }

    this.itimer.displayTime = this.itimer.secondsRemaining.toString()
  }

  startTimer() {
    this.itimer.hasStarted = true
    this.itimer.runTimer = true
    this.timerTick()
  }

  pauseTimer() {
    this.itimer.runTimer = false
  }

  resumeTimer() {
    this.startTimer()
  }

  timerTick() {
    setTimeout(() => {
      if (!this.itimer.runTimer) {
        return
      }
      if (this.itimer.secondsRemaining > 0) {
        this.itimer.secondsRemaining--
        this.itimer.displayTime = this.itimer.secondsRemaining.toString()
        if (this.itimer.secondsRemaining > this.timer.end) {
          this.timerTick()
        } else {
          this.dialogs.beep(1)
          this.vibration.vibrate(600)

          if (this.timer.end === 0) {
            this.itimer.hasFinished = true
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
