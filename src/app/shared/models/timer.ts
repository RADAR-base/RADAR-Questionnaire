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
