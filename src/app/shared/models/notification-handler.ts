export enum NotificationType {
  SOON,
  NOW,
  REMINDER,
  MISSED_SOON,
  MISSED,
  TEST
}

export enum NotificationActionType {
  SCHEDULE_ALL,
  TEST,
  CANCEL_ALL,
  CANCEL_SINGLE
}

export interface SingleNotification {
  task?: NotificationTaskInfo
  timestamp: number
  type: NotificationType
  title?: string
  text?: string
  vibrate?: boolean
  sound?: boolean
  id?: number
}

export interface NotificationTaskInfo {
  name: string
  timestamp: number
  completionWindow: number
}

export enum NotificationMessagingType {
  LOCAL = 'LOCAL',
  FCM = 'FCM',
  FCM_XMPP = 'FCM_XMPP',
  FCM_REST = 'FCM_REST'
}
