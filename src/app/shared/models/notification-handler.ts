import { Task } from './task'

export enum NotificationType {
  SOON,
  NOW,
  REMINDER,
  MISSED_SOON,
  MISSED,
}

export interface SingleNotification {
  task?: Task
  timestamp: number
  type: NotificationType
  title?: string
  text?: string
  vibrate?: boolean
  sound?: boolean
}
