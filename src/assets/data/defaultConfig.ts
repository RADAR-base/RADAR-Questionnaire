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
export const DefaultTaskCompletionWindow = 86400000 // 1 day in ms
export const DefaultESMCompletionWindow = 600000 // 10 mins in ms

export const DefaultTask: Task = {
  index: 0,
  completed: false,
  reportedCompletion: false,
  timestamp: 0,
  name: 'DEFAULT',
  reminderSettings: {
    unit: 'hour',
    amount: 1,
    repeat: 1
  },
  nQuestions: 0,
  estimatedCompletionTime: 0,
  completionWindow: DefaultTaskCompletionWindow,
  warning: '',
  isClinical: false
}

export const DefaultTaskTest: Task = {
  index: 0,
  completed: false,
  reportedCompletion: false,
  timestamp: 0,
  name: 'TEST',
  reminderSettings: {},
  nQuestions: 0,
  estimatedCompletionTime: 0,
  completionWindow: DefaultTaskCompletionWindow,
  warning: '',
  isClinical: false
}

export const DefaultSettingsSelectedLanguage: LanguageSetting = {
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

export const DefaultScheduleVersion: number = 0

export const DefaultScheduleYearCoverage: number = 2 // years

export const DefaultScheduleReportRepeat: number = 7 // days

export const DefaultNotificationType: string = 'FCM' // choose from 'FCM' or 'LOCAL'
export const DefaultMaxUpstreamResends = 100
export const DefaultNumberOfNotificationsToSchedule: number = 100 //
export const DefaultNumberOfNotificationsToRescue: number = 12 //
export const FCMPluginProjectSenderId: string = '430900191220'
export const DefaultNotificationRefreshTime: number = 900000 // 15 mins in ms

export const DefaultSourcePrefix = 'aRMT'
export const DefaultSourceTypeModel: string = `${DefaultSourcePrefix}-App`
export const DefaultSourceTypeRegistrationBody = {
  sourceTypeCatalogVersion: '1.4.3',
  sourceTypeModel: DefaultSourceTypeModel,
  sourceTypeProducer: 'RADAR'
  // "deviceTypeId": 1104
}

export const DefaultEndPoint: string =
  'https://radar-cns-platform.rosalind.kcl.ac.uk/'

// GITHUB SOURCES

export const GIT_API_URI = 'https://api.github.com/repos'
export const DefaultOrganisation = 'RADAR-Base'

export const DefaultProtocolRepo = 'RADAR-aRMT-protocols'
export const DefaultProtocolBranch = 'master'
export const DefaultProtocolPath = `protocol.json?ref=${DefaultProtocolBranch}`
export const DefaultProtocolEndPoint = [
  GIT_API_URI,
  DefaultOrganisation,
  DefaultProtocolRepo,
  'contents'
].join('/')

export const DefaultSchemaRepo = 'RADAR-Schemas'
export const DefaultSchemaBranch = 'master'
export const DefaultSchemaSpecPath = `specifications/active/${DefaultSourcePrefix}-${
  DefaultSourceTypeRegistrationBody.sourceTypeCatalogVersion
}.yml?ref=${DefaultSchemaBranch}`
export const DefaultSchemaSpecEndpoint = [
  GIT_API_URI,
  DefaultOrganisation,
  DefaultSchemaRepo,
  'contents',
  DefaultSchemaSpecPath
].join('/')

export const DefaultSourceProducerAndSecret = DefaultSourceProducerAndSecretExport

// CONFIG SERVICE

export const DefaultQuestionnaireTypeURI = '_armt'
export const DefaultQuestionnaireFormatURI = '.json'

// AUTH SERVICE

export const DefaultManagementPortalURI = 'managementportal'
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

export const DefaultTokenRefreshTime = 1800000 // 30 minutes in ms

// TIME CONVERSIONS

export const SEC_MILLISEC = 1000
export const HOUR_MIN = 60
export const MIN_SEC = 60

export const DefaultTimeInterval = { unit: 'day', amount: 1 }

// KAFKA

export const KAFKA_ASSESSMENT = 'assessment'
export const KAFKA_COMPLETION_LOG = 'completion_log'
export const KAFKA_TIMEZONE = 'timezone'
export const KAFKA_CLIENT_KAFKA = '/kafka'

export const DefaultNumberOfCompletionLogsToSend = 10

// AUDIO TASK

export const DefaultMaxAudioAttemptsAllowed = 15
export const DefaultAudioRecordOptions = {
  SampleRate: 16000,
  NumberOfChannels: 1
}
