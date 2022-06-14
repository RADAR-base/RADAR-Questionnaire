export enum UsageEventType {
  NOTIFICATION_OPEN = 'notification_open',
  APP_OPEN = 'app_open',
  QUESTIONNAIRE_STARTED = 'questionnaire_started',
  QUESTIONNAIRE_FINISHED = 'questionnaire_finished',
  QUESTIONNAIRE_CANCELLED = 'questionnaire_cancelled',
  QUESTIONNAIRE_TRIGGERED = 'questionnaire_triggered',
  FCM_MESSAGE_RECEIVED = 'fcm_message_received',
  QUESTIONNAIRE_TRIGGER_MESSAGE_RECEIVED = 'questionnaire_trigger_message_received',
  QUESTIONNAIRE_TRIGGER_DEFINITION_PULL_SUCCESS = 'questionnaire_trigger_definition_pull_success',
  QUESTIONNAIRE_TRIGGER_ERROR = 'questionnaire_trigger_error',
  QR_SCANNED = 'qr_code_scanned',
  CLICK = 'click',
  RESUMED = 'resumed',
  RECORDING_STARTED = 'recording_started',
  RECORDING_STOPPED = 'recording_stopped',
  RECORDING_ERROR = 'recording_error'
}

export enum EnrolmentEventType {
  SUCCESS = 'sign_up',
  FAIL = 'sign_up_fail',
  ERROR = 'sign_up_error'
}

export enum DataEventType {
  PREPARED_OBJECT = 'prepared_kafka_object',
  CACHED = 'send_to_cache',
  REMOVED_FROM_CACHE = 'removed_from_cache',
  SEND_SUCCESS = 'send_success',
  SEND_ERROR = 'send_error'
}

export enum ConfigEventType {
  PROTOCOL_CHANGE = 'protocol_change',
  APP_VERSION_CHANGE = 'app_version_change',
  APP_UPDATE_AVAILABLE = 'app_update_available',
  TIMEZONE_CHANGE = 'timezone_change',
  ERROR = 'config_error',
  APP_RESET = 'app_reset',
  APP_RESET_PARTIAL = 'app_reset_partial'
}

export enum NotificationEventType {
  CANCELLED = 'notification_cancelled',
  REFRESHED = 'notification_refreshed',
  RESCHEDULED = 'notification_rescheduled',
  TEST = 'notification_test'
}

export enum KeyboardEventType {
  FOCUS = 'focus',
  BLUR = 'blur',
  ENTER = 'enter'
}

export enum NextButtonEventType {
  AUTO = 'auto',
  DISABLE = 'disable',
  ENABLE = 'enable'
}
