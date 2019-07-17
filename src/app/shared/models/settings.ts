export interface Settings {
  appVersion?: string
  cacheSize?: number
  scheduleVersion?: string
  participantID?: string
  projectName?: string
  enrolmentDate?: string
  language?: LanguageSetting
  languagesSelectable?: LanguageSetting[]
  notificationSettings?: NotificationSettings
  weeklyReport?: WeeklyReportSubSettings[]
  lastUploadDate?: Date
}
export interface NotificationSettings {
  sound: boolean
  vibration: boolean
  nightMode: boolean
}

export interface WeeklyReportSubSettings {
  name: string
  show: boolean
}

export interface LanguageSetting {
  label: string
  value: string
}
