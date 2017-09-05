import { NotificationSettings } from '../../models/settings'
import { WeeklyReportSubSettings } from '../../models/settings'
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

export const FirebaseConfig = {
  apiKey: "AIzaSyBFVrRB-XE7nO1qmTXo74RaBeyWf0bWvTU",
  authDomain: "fir-80243.firebaseapp.com",
  databaseURL: "https://fir-80243.firebaseio.com",
  projectId: "fir-80243",
  storageBucket: "fir-80243.appspot.com",
  messagingSenderId: "236588887630"
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
  estimatedCompletionTime: 0
}

export const DefaultSettingsSupportedLanguages: String[] = [
  'English',
  'Italian',
  'Spanish',
  'Dutch',
  'German'
]

export const DefaultScheduleVersion: number = 0

export const DefaultScheduleYearCoverage: number = 2 //years

export const DefaultScheduleReportRepeat: number = 7 //days
