import { Reminders } from './protocol'

export interface Task {
 dateTime: Date
 name: String
 reminderSettings: Reminders
 nQuestions: number
 estimatedCompletionTime: number
}
