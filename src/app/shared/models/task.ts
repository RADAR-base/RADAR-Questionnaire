import { AssessmentType } from './assessment'
import { SingleNotification } from './notification-handler'

export interface Task {
  id: number
  completed: boolean
  reportedCompletion: boolean
  timestamp: number
  name: string
  type: AssessmentType
  nQuestions: number
  estimatedCompletionTime?: number
  completionWindow: number
  warning: string
  requiresInClinicCompletion?: boolean
  notifications: SingleNotification[]
  timeCompleted: number
  showInCalendar: boolean
  isDemo: boolean
  order: number
  isLastTask?: boolean
  status?: string
}

export interface TasksProgress {
  numberOfTasks: number
  completedTasks: number
}
