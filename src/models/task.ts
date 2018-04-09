import { Reminders } from './protocol'

export interface Task {
 index: number
 completed: boolean
 timestamp: number
 name: String
 reminderSettings: Reminders
 nQuestions: number
 estimatedCompletionTime: number
 warning: string
 isClinical: boolean
}

export interface TasksProgress {
  numberOfTasks: number
  completedTasks: number
}
