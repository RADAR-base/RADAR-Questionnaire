import { LocKeys } from '../../enums/localisations'
import {
  LanguageSetting,
  NotificationSettings,
  WeeklyReportSubSettings
} from '../../models/settings'
import { Task } from '../../models/task'
import {
  DefaultProtocolEndPointExport,
  DefaultSourceProducerAndSecretExport
} from './secret'

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
export const DefaultNumberOfNotificationsToSchedule: number = 100 //
export const DefaultNumberOfNotificationsToRescue: number = 12 //
export const FCMPluginProjectSenderId: string = '486403643787'
export const DefaultNotificationRefreshTime: number = 900000 // 15 mins in ms

export const DefaultSourceTypeModel: string = 'aRMT-App'
export const DefaultSourceTypeRegistrationBody: any = {
  sourceTypeCatalogVersion: '1.2.0',
  sourceTypeModel: 'aRMT-App',
  sourceTypeProducer: 'RADAR'
  // "deviceTypeId": 1104
}

export const DefaultEndPoint: string =
  'https://radar-cns-platform.rosalind.kcl.ac.uk/'
// export const DefaultEndPoint: string = 'https://radar-backend.co.uk/'

export const DefaultProtocolEndPoint: string = DefaultProtocolEndPointExport

export const DefaultSourceProducerAndSecret: string = DefaultSourceProducerAndSecretExport

// CONFIG SERVICE

export const DefaultProtocolURI = '/protocol.json'
export const DefaultQuestionnaireTypeURI = '_armt'
export const DefaultQuestionnaireFormatURI = '.json'
export const ARMTDefBranchProd = 'master'
export const ARMTDefBranchTest = 'test'
export const TEST_ARMT_DEF = true

// AUTH SERVICE

export const DefaultManagementPortalURI = 'managementportal'
export const DefaultRefreshTokenURI = '/oauth/token'
export const DefaultSubjectsURI = '/api/subjects/'

export const DefaultRequestEncodedContentType =
  'application/x-www-form-urlencoded'
export const DefaultRequestJSONContentType = 'application/json'
export const DefaultRefreshTokenRequestBody =
  'grant_type=refresh_token&refresh_token='
