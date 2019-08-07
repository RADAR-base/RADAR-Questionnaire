export interface Timer {
  start: number
  end: number
}

export interface TaskTimer {
  duration: number
  secondsElapsed: number
  secondsRemaining: number
  hasStarted: boolean
  hasFinished: boolean
  displayTime: number
}
