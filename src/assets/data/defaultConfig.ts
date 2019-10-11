import { LocKeys } from '../../app/shared/enums/localisations'
import {
  LanguageSetting,
  NotificationSettings,
  WeeklyReportSubSettings
} from '../../app/shared/models/settings'
import { Task } from '../../app/shared/models/task'
import { DefaultSourceProducerAndSecretExport } from './secret'

// DEFAULT SETTINGS
export const DefaultSettingsNotifications: NotificationSettings = {
  sound: true,
  vibration: false,
  nightMode: true
}

export const DefaultSettingsWeeklyReport: WeeklyReportSubSettings[] = [
  {
    name: LocKeys.MEASURE_PROGRESS.toString(),
    show: false
  },
  {
    name: LocKeys.MEASURE_STEPS.toString(),
    show: false
  },
  {
    name: LocKeys.MEASURE_HEART_RATE.toString(),
    show: false
  }
]

// DEFAULT SETUP
export const DefaultTaskCompletionWindow = 0 // 1 day in ms
export const DefaultESMCompletionWindow = 600000 // 10 mins in ms

export const DefaultTask: Task = {
  index: 0,
  completed: false,
  reportedCompletion: false,
  timestamp: 0,
  name: 'DEFAULT',
  nQuestions: 0,
  estimatedCompletionTime: 0,
  completionWindow: DefaultTaskCompletionWindow,
  warning: '',
  isClinical: false,
  notifications: [],
  iconInfo: 'checkbox-outline'
}

export const DefaultTaskTest: Task = {
  index: 0,
  completed: false,
  reportedCompletion: false,
  timestamp: 0,
  name: 'TEST',
  nQuestions: 0,
  estimatedCompletionTime: 0,
  completionWindow: DefaultTaskCompletionWindow,
  warning: '',
  isClinical: false,
  notifications: [],
  iconInfo: 'checkbox-outline'
}

export const DefaultLanguage: LanguageSetting = {
  label: '',
  value: ''
}

export const DefaultSettingsSupportedLanguages: LanguageSetting[] = [
  {
    label: LocKeys.LANGUAGE_ENGLISH.toString(),
    value: 'en'
  },
  {
    label: LocKeys.LANGUAGE_ITALIAN.toString(),
    value: 'it'
  },
  {
    label: LocKeys.LANGUAGE_SPANISH.toString(),
    value: 'es'
  },
  {
    label: LocKeys.LANGUAGE_DUTCH.toString(),
    value: 'nl'
  },
  {
    label: LocKeys.LANGUAGE_DANISH.toString(),
    value: 'da'
  },
  {
    label: LocKeys.LANGUAGE_GERMAN.toString(),
    value: 'de'
  }
]

export const LanguageMap = {
  en: LocKeys.LANGUAGE_ENGLISH.toString(),
  it: LocKeys.LANGUAGE_ITALIAN.toString(),
  es: LocKeys.LANGUAGE_SPANISH.toString(),
  nl: LocKeys.LANGUAGE_DUTCH.toString(),
  da: LocKeys.LANGUAGE_DANISH.toString(),
  de: LocKeys.LANGUAGE_GERMAN.toString()
}

export const DefaultAppVersion: string = '0.5.11.1-alpha'

export const DefaultScheduleVersion = '0.3.10'

export const DefaultScheduleYearCoverage: number = 1 // years

export const DefaultScheduleReportRepeat: number = 7 // days

export const DefaultNotificationType: string = 'FCM' // choose from 'FCM' or 'LOCAL'
export const DefaultMaxUpstreamResends = 100
export const DefaultNumberOfNotificationsToSchedule: number = 100 //
export const DefaultNumberOfNotificationsToRescue: number = 12 //
export const FCMPluginProjectSenderId: string = '723817636551'
export const DefaultNotificationRefreshTime: number = 900000 // 15 mins in ms
export const DefaultNotificationTtlMinutes: number = 10

export const DefaultSourcePrefix = 'aRMT'
export const DefaultSourceTypeModel: string = `${DefaultSourcePrefix}-App`
export const DefaultSourceTypeRegistrationBody = {
  sourceTypeCatalogVersion: '1.4.3',
  sourceTypeModel: DefaultSourceTypeModel,
  sourceTypeProducer: 'RADAR'
  // "deviceTypeId": 1104
}

export const DefaultEndPoint: string =
  'https://ucl-mighealth-dev.thehyve.net'

export const DefaultKeycloakURL = '/auth/';

export const DefaultCallbackURL = 'http://localhost:8100/';

export const DefaultProjectName = 'STAGING_PROJECT'

export const DefaultPlatformInstance = 'RADAR-CNS'

// GITHUB SOURCES

export const GIT_API_URI = 'https://api.github.com/repos'

export const DefaultProtocolGithubRepo = 'RADAR-Base/RADAR-aRMT-protocols'
export const DefaultProtocolBranch = 'master'
export const DefaultProtocolPath = `protocol.json`
export const DefaultProtocolEndPoint = [
  GIT_API_URI,
  DefaultProtocolGithubRepo,
  'contents'
].join('/')

export const DefaultSchemaGithubRepo = 'RADAR-Base/RADAR-Schemas'
export const DefaultSchemaBranch = 'master'
// tslint:disable-next-line: max-line-length
export const DefaultSchemaSpecPath = `specifications/active/${DefaultSourcePrefix}-${DefaultSourceTypeRegistrationBody.sourceTypeCatalogVersion}.yml?ref=${DefaultSchemaBranch}`
export const DefaultSchemaSpecEndpoint = [
  GIT_API_URI,
  DefaultSchemaGithubRepo,
  'contents',
  DefaultSchemaSpecPath
].join('/')

const oauthParts = DefaultSourceProducerAndSecretExport.split(':')

export const DefaultOAuthClientId = oauthParts.shift()
// TODO: Use empty client secret https://github.com/RADAR-base/RADAR-Questionnaire/issues/140
export const DefaultOAuthClientSecret = oauthParts.join(':')

export const DefaultPackageName = 'uk.ac.ucl.ihi.onthemove'

// CONFIG SERVICE

export const DefaultQuestionnaireTypeURI = '_armt'
export const DefaultQuestionnaireFormatURI = '.json'

// AUTH SERVICE

export const DefaultManagementPortalURI = '/managementportal'
export const DefaultRefreshTokenURI = '/oauth/token'
export const DefaultSubjectsURI = '/api/subjects/'
export const DefaultMetaTokenURI: string = '/api/meta-token/'

export const DefaultRequestEncodedContentType =
  'application/x-www-form-urlencoded'
export const DefaultRequestJSONContentType = 'application/json'
export const DefaultRefreshTokenRequestBody =
  'grant_type=refresh_token&refresh_token='

export const DefaultEnrolmentBaseURL =
  DefaultEndPoint + DefaultManagementPortalURI

export const DefaultTokenRefreshSeconds = 1800 // 30 minutes in s

export const DefaultTimeInterval = { unit: 'day', amount: 1 }

// KAFKA

export const DefaultKafkaURI = '/kafka'

export const DefaultNumberOfCompletionLogsToSend = 10

// AUDIO TASK

export const DefaultMaxAudioAttemptsAllowed = 5
export const DefaultAudioRecordOptions = {
  SampleRate: 16000,
  NumberOfChannels: 1
}
