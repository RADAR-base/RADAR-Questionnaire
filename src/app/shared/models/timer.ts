export interface Timer {
  start: number
  end: number
}

export interface TaskTimer {
  seconds: number
  secondsRemaining: number
  runTimer: boolean
  hasStarted: boolean
  hasFinished: boolean
  displayTime: string
}
