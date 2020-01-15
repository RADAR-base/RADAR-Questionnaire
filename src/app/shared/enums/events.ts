export enum UsageEventType {
  NOTIFICATION_OPEN = 'NOTIFICATION_OPEN',
  APP_OPEN = 'APP_OPEN',
  QUESTIONNAIRE_STARTED = 'QUESTIONNAIRE_STARTED',
  QUESTIONNAIRE_FINISHED = 'QUESTIONNAIRE_FINISHED',
  QUESTIONNAIRE_CANCELLED = 'QUESTIONNAIRE_CANCELLED',
  QUESTIONNAIRE_INTERRUPTED = 'QUESTIONNAIRE_INTERRUPTED',
  WANT_TO_EXIT_NOW = 'WANT_TO_EXIT_NOW',
  WANT_TO_CONTINUE = 'WANT_TO_CONTINUE',
  QR_SCANNED = 'qr_code_scanned',
  CLICK = 'click',
  RESUMED = 'resumed'
}

export enum EnrolmentEventType {
  SUCCESS = 'sign_up',
  FAIL = 'sign_up_fail',
  ERROR = 'sign_up_error',
  ELIGIBILITY_MET = 'ELIGIBILITY_MET',
  ELIGIBILITY_NOT_MET = 'ELIGIBILITY_NOT_MET',
  CONSENT_RECEIVED = 'CONSENT_RECEIVED',
  CONSENT_NOT_RECEIVED = 'CONSENT_NOT_RECEIVED',
  CONSENT_PARTIALLY_RECEIVED = 'CONSENT_PARTIALLY_RECEIVED',
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
