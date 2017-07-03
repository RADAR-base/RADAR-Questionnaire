import { NotificationSettings } from '../../models/settings'
import { WeeklyReportSubSettings } from '../../models/settings'

// FIREBASE SETUP
export const FirebaseConfig = {
  apiKey: "AIzaSyBTEYv6htFpRUXrp5G1cqnAcHT71Ed_lA0",
  authDomain: "radar-armt.firebaseapp.com",
  databaseURL: "https://radar-armt.firebaseio.com",
  projectId: "radar-armt",
  storageBucket: "radar-armt.appspot.com",
  messagingSenderId: "1044012430872"
}

// DEFAULT SETTINGS
export const DefaultSettingsNotifications: NotificationSettings = {
  sound: true,
  vibration: false,
  nightMode: true
}

export const DefaultSettingsWeeklyReport: WeeklyReportSubSettings[] = [
    {
      name: 'Progress',
      show: false
    },
    {
      name: 'Steps',
      show: false
    },
    {
      name: 'Heart rate',
      show: false
    }
  ]

export const DefaultSettingsSupportedLanguages: String[] = [
  'English',
  'Italian',
  'Spanish',
  'Dutch',
  'German'
]

export const DefaultScheduleVersion: number = 0

export const DefaultScheduleYearCoverage: number = 2
