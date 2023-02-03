export enum NotificationType {
  SOON,
  NOW,
  REMINDER,
  MISSED_SOON,
  MISSED,
  TEST
}

export enum NotificationActionType {
  SCHEDULE_SINGLE,
  SCHEDULE_ALL,
  TEST,
  CANCEL_ALL,
  CANCEL_SINGLE
}

export interface SingleNotification {
  task?: NotificationTaskInfo
  timestamp: number
  type?: NotificationType
  title?: string
  text?: string
  vibrate?: boolean
  sound?: boolean
  id?: number
  messageId?: number
}

export interface NotificationTaskInfo {
  name: string
  timestamp: number
  completionWindow: number
}

export enum NotificationMessagingType {
  LOCAL = 'LOCAL',
  FCM_REST = 'FCM_REST'
}

export enum SchedulerType {
  LOCAL = 'LOCAL',
  APPSERVER = 'APPSERVER'
}

export enum NotificationMessagingState {
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED'
}

export enum MessagingAction {
  QUESTIONNAIRE_TRIGGER = 'QUESTIONNAIRE_TRIGGER'
}
