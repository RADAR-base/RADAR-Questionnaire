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

  constructor(public value: string) {}

  toString() {
    return this.value
  }
}
