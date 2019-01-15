import { Task } from './task'

export enum NotificationType {
  SOON,
  NOW,
  REMINDER,
  MISSED_SOON,
  MISSED,
  TEST
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
