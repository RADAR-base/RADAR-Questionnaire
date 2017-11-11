import { NotificationSettings } from '../../models/settings'
import { WeeklyReportSubSettings } from '../../models/settings'
import { LanguageSetting } from '../../models/settings'
import { LocKeys } from '../../enums/localisations'
import { Task } from '../../models/task'

// FIREBASE SETUP
/*export const FirebaseConfig = {
  apiKey: "AIzaSyBTEYv6htFpRUXrp5G1cqnAcHT71Ed_lA0",
  authDomain: "radar-armt.firebaseapp.com",
  databaseURL: "https://radar-armt.firebaseio.com",
  projectId: "radar-armt",
  storageBucket: "radar-armt.appspot.com",
  messagingSenderId: "1044012430872"
}*/

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
  timestamp: 0,
  name: 'DEFAULT',
  reminderSettings: {
    unit: 'hour',
    amount: 1,
    repeat: 1
  },
  nQuestions: 0,
  estimatedCompletionTime: 0,
  warning: ''
}

export const DefaultSettingsSelectedLanguage: LanguageSetting = {
  label: "",
  value: ""
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
  'en': LocKeys.LANGUAGE_ENGLISH.toString(),
  'it': LocKeys.LANGUAGE_ITALIAN.toString(),
  'es': LocKeys.LANGUAGE_SPANISH.toString(),
  'nl': LocKeys.LANGUAGE_DUTCH.toString(),
  'da': LocKeys.LANGUAGE_DANISH.toString(),
  'de': LocKeys.LANGUAGE_GERMAN.toString()
}

export const DefaultScheduleVersion: number = 0

export const DefaultScheduleYearCoverage: number = 2 //years

export const DefaultScheduleReportRepeat: number = 7 //days

export const DefaultEndPoint: string = 'https://radar-cns-platform.rosalind.kcl.ac.uk/'

export const DefaultProtocolEndPoint: string = 'https://raw.githubusercontent.com/RADAR-CNS/RADAR-aRMT-protocols/master/'
