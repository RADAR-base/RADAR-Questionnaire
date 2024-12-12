export class StorageKeys {
  static APP_VERSION = new StorageKeys('APP_VERSION')
  static REFERENCEDATE = new StorageKeys('REFERENCEDATE')
  static ENROLMENTDATE = new StorageKeys('ENROLMENTDATE')
  static OAUTH_TOKENS = new StorageKeys('OAUTH_TOKENS')
  static PARTICIPANTID = new StorageKeys('PARTICIPANTID')
  static PARTICIPANTLOGIN = new StorageKeys('PARTICIPANTLOGIN')
  static PARTICIPANT_ATTRIBUTES = new StorageKeys('PARTICIPANT_ATTRIBUTES')
  static PROJECTNAME = new StorageKeys('PROJECTNAME')
  static SOURCEID = new StorageKeys('SOURCEID')
  static LANGUAGE = new StorageKeys('LANGUAGE')
  static SETTINGS_NOTIFICATIONS = new StorageKeys('SETTINGS_NOTIFICATIONS')
  static SETTINGS_LANGUAGES = new StorageKeys('SETTINGS_LANGUAGES')
  static SETTINGS_WEEKLYREPORT = new StorageKeys('SETTINGS_WEEKLYREPORT')
  static CONFIG_VERSION = new StorageKeys('CONFIG_VERSION')
  static CONFIG_ASSESSMENTS = new StorageKeys('CONFIG_ASSESSMENTS')
  static CONFIG_ON_DEMAND_ASSESSMENTS = new StorageKeys(
    'CONFIG_ON_DEMAND_ASSESSMENTS'
  )
  static CONFIG_CLINICAL_ASSESSMENTS = new StorageKeys(
    'CONFIG_CLINICAL_ASSESSMENTS'
  )
  static SCHEDULE_VERSION = new StorageKeys('SCHEDULE_VERSION')
  static SCHEDULE_HASH_URL = new StorageKeys('SCHEDULE_HASH_URL')
  static SCHEDULE_TASKS = new StorageKeys('SCHEDULE_TASKS')
  static SCHEDULE_TASKS_ON_DEMAND = new StorageKeys('SCHEDULE_TASKS_ON_DEMAND')
  static SCHEDULE_TASKS_CLINICAL = new StorageKeys('SCHEDULE_TASKS_CLINICAL')

  // NOTE: SCHEDULE_TASKS_COMPLETED: All completed tasks from midnight of last schedule generation date
  static SCHEDULE_TASKS_COMPLETED = new StorageKeys('SCHEDULE_TASKS_COMPLETED')

  static SCHEDULE_REPORT = new StorageKeys('SCHEDULE_REPORT')
  static CACHE_ANSWERS = new StorageKeys('CHACHE_ANSWERS')
  static TIME_ZONE = new StorageKeys('TIME_ZONE')
  static UTC_OFFSET = new StorageKeys('UTC_OFFSET')
  static UTC_OFFSET_PREV = new StorageKeys('UTC_OFFSET_PREV')
  static LAST_NOTIFICATION_UPDATE = new StorageKeys('LAST_NOTIFICATION_UPDATE')
  static LAST_UPLOAD_DATE = new StorageKeys('LAST_UPLOAD_DATE')
  static BASE_URI = new StorageKeys('BASE_URI')
  static TOKEN_ENDPOINT = new StorageKeys('TOKEN_ENDPOINT')

  static REMOTE_CONFIG_CACHE_TIMEOUT = new StorageKeys(
    'REMOTE_CONFIG_CACHE_TIMEOUT'
  )

  static TOPIC_CACHE_TIMEOUT = new StorageKeys('TOPIC_CACHE_TIMEOUT')

  static FCM_TOKEN = new StorageKeys('FCM_TOKEN')
  static NOTIFICATION_MESSAGING_TYPE = new StorageKeys(
    'NOTIFICATION_MESSAGING_TYPE'
  )

  static HEALTH_LAST_POLL_TIMES = new StorageKeys('HEALTH_LAST_POLL_TIMES')

  constructor(public value: string) { }

  toString() {
    return this.value
  }
}
