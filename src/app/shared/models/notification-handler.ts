export enum NotificationType {
  SOON,
  NOW,
  REMINDER,
  MISSED_SOON,
  MISSED,
  TEST
}

export interface SingleNotification {
  task?: NotificationTaskInfo
  timestamp: number
  type: NotificationType
  title?: string
  text?: string
  vibrate?: boolean
  sound?: boolean
}

export interface NotificationTaskInfo {
  name: string
  timestamp: number
  completionWindow: number
}
