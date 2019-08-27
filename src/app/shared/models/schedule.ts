export interface ScheduleValueExport {
  time: number
  version: string
  tasks: SimpleTask[]
}

export interface SimpleTask {
  name: string
  timestamp: number
  timeCompleted: number
}
