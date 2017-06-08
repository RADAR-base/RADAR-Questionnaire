import { Reminders } from './protocol'

export interface Task {
 timestamp: number
 name: String
 reminderSettings: Reminders
 nQuestions: number
 estimatedCompletionTime: number
}
