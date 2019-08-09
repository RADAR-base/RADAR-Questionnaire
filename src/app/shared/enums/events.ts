export enum UsageEventType {
  APP_OPEN_NOTIFICATION = 'APP_OPEN_NOTIFICATION',
  APP_OPEN_DIRECTLY = 'APP_OPEN_DIRECTLY',
  QUESTIONNAIRE_STARTED = 'QUESTIONNAIRE_STARTED',
  QUESTIONNAIRE_FINISHED = 'QUESTIONNAIRE_FINISHED',
  QUESTIONNAIRE_CLOSED = 'QUESTIONNAIRE_CLOSED',
  QR_SCANNED = 'qr_code_scanned',
  SIGN_UP = 'sign_up',
  SIGN_UP_FAIL = 'sign_up_fail',
  SIGN_UP_ERROR = 'sign_up_error',
  APP_RESET = 'app_reset',
  CLICK = 'click',
  RESUMED = 'resumed'
}

export enum KafkaEventType {
  SEND_SUCCESS = 'send_success',
  SEND_ERROR = 'send_error',
  PREPARED_OBJECT = 'prepared_kafka_object'
}

export enum DataEventType {
  PROCESSED = 'processed_questionnaire_data',
  CACHED = 'send_to_cache'
}

export enum ConfigEventType {
  PROTOCOL_CHANGE = 'protocol_change',
  APP_VERSION_CHANGE = 'app_version_change',
  TIMEZONE_CHANGE = 'timezone_change'
}

export enum NotificationEventType {
  CANCELLED = 'notification_cancelled',
  REFRESHED = 'notification_refreshed',
  RESCHEDULED = 'notification_rescheduled',
  TEST = 'notification_test'
}
