import { Component, EventEmitter, Input, Output } from '@angular/core'
import { Dialogs } from '@ionic-native/dialogs'

let uniqueID = 0

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
export class TimedTestComponent {

  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input() heading: string
  @Input() image: string
  @Input() timer: Timer
  public itimer: ITimer
  
  constructor(private dialogs: Dialogs) {
  }

  ngOnInit() {
      this.initTimer();
  }

  start() {
    if(this.itimer.hasStarted) {
        this.resumeTimer()
      }
      else {
        setTimeout(() => {
          this.startTimer()
        }, 1000)
      }
  }

  hasFinished() {
        return this.itimer.hasFinished
    }

  hasStarted() {
    return this.itimer.hasStarted
  }
 
  initTimer() {
      if(!this.timer) { 
          this.timer.start = 0
        }

      this.itimer = <ITimer>{
          seconds: this.timer.start,
          runTimer: false,
          hasStarted: false,
          hasFinished: false,
          secondsRemaining: this.timer.start
      };

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

        if (!this.itimer.runTimer) { return }
          if (this.itimer.secondsRemaining>0) {
            this.itimer.secondsRemaining--
            this.itimer.displayTime = this.itimer.secondsRemaining.toString()
            if (this.itimer.secondsRemaining > this.timer.end) {
                this.timerTick()
            }
            else {
                this.dialogs.beep(1)

                if (this.timer.end == 0) {
                    this.itimer.hasFinished = true
                }
                else {
                    this.pauseTimer()
                }
                // save timestamp (epoch) and activate the next button
                this.valueChange.emit((new Date).getTime())
            }
          }
      }, 1000)
  }
}