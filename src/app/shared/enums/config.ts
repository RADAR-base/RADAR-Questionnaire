export class ConfigKeys {
  static KAFKA_SPECIFICATION_URL = new ConfigKeys('kafka_specification_url')
  static OAUTH_REFRESH_SECONDS = new ConfigKeys('oauth_refresh_seconds')
  static OAUTH_CLIENT_ID = new ConfigKeys('oauth_client_id')
  static OAUTH_CLIENT_SECRET = new ConfigKeys('oauth_client_secret')
  static PROTOCOL_PATH = new ConfigKeys('protocol_path')
  static PROTOCOL_BRANCH = new ConfigKeys('protocol_branch')
  static PROTOCOL_REPO = new ConfigKeys('protocol_repo')
  static NOTIFICATION_TTL_MINUTES = new ConfigKeys('notification_ttl_minutes')
  static PLATFORM_INSTANCE = new ConfigKeys('platform_instance')
  static QUESTIONS_HIDDEN = new ConfigKeys('questions_hidden')
  static APP_VERSION_LATEST = new ConfigKeys('app_version_latest')
  static NOTIFICATION_MESSAGING_TYPE = new ConfigKeys(
    'notification_messaging_type'
  )
  static SCHEDULE_SERVICE_TYPE = new ConfigKeys('schedule_service_type')
  static APP_SERVER_URL = new ConfigKeys('app_server_url')
  static ON_DEMAND_ASSESSMENT_LABEL = new ConfigKeys(
    'on_demand_assessment_label'
  )
  static ON_DEMAND_ASSESSMENT_ICON = new ConfigKeys('on_demand_assessment_icon')
  static PARTICIPANT_ATTRIBUTE_ORDER = new ConfigKeys(
    'participant_attribute_order'
  )
  static SCHEDULE_YEAR_COVERAGE = new ConfigKeys('schedule_year_coverage')

  static APP_CREDITS_TITLE = new ConfigKeys('app_credits_title')
  static APP_CREDITS_BODY = new ConfigKeys('app_credits_body')

  static AUTO_NEXT_QUESTIONNAIRE_TYPES = new ConfigKeys(
    'auto_next_questionnaire_types'
  )
  static SKIPPABLE_QUESTIONNAIRE_TYPES = new ConfigKeys(
    'skippable_questionnaire_types'
  )

  static GITHUB_FETCH_STRATEGY = new ConfigKeys('github_fetch_strategy')

  static TOPIC_CACHE_TIMEOUT = new ConfigKeys('topic_cache_timeout')

  static SHOW_TASK_CALENDAR_NAME = new ConfigKeys('show_task_calendar_name')
  static SHOW_TASK_PROGRESS_COUNT = new ConfigKeys('show_task_progress_count')
  static SHOW_TASK_INFO = new ConfigKeys('show_task_info')

  static HEALTHKIT_LOOKBACK_INTERVAL_DAYS = new ConfigKeys('healthkit_lookback_interval_days')
  static HEALTHKIT_PERMISSIONS = new ConfigKeys('healthkit_permissions')

  static AUDIO_SAMPLING_RATE = new ConfigKeys('audio_sampling_rate')

  static AUDIO_BIT_RATE = new ConfigKeys('audio_bit_rate')

  static AUDIO_ENCODER = new ConfigKeys('audio_encoder')

  static TOKEN_BACKUP = new ConfigKeys('token_backup')

  constructor(public value: string) { }

  toString() {
    return this.value
  }
}
