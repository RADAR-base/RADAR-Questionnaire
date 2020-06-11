import { SingleNotification } from './notification-handler'

export interface Task {
  index: number
  completed: boolean
  reportedCompletion: boolean
  timestamp: number
  name: string
  nQuestions: number
  estimatedCompletionTime?: number
  completionWindow: number
  warning: string
  isClinical: boolean
  notifications: SingleNotification[]
  timeCompleted: number
  showInCalendar: boolean
  isDemo: boolean
  order: number
  isLastTask?: boolean
}

export interface TasksProgress {
  numberOfTasks: number
  completedTasks: number
}
