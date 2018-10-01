import { Reminders } from './protocol'

export interface Task {
  index: number
  completed: boolean
  reportedCompletion: boolean
  timestamp: number
  name: string
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
