import { MultiLanguageText } from './text'

export interface ClinicalProtocol {
  requiresInClinicCompletion?: boolean
  repeatAfterClinicVisit: RepeatQuestionnaire
}

export interface Protocol {
  notification?: Notification
  repeatProtocol: TimeInterval
  repeatQuestionnaire: RepeatQuestionnaire
  reminders?: Reminder[]
  clinicalProtocol?: ClinicalProtocol
  completionWindow?: TimeInterval
}

export interface TimeInterval {
  unit?: string
  amount?: number
}

export interface RepeatQuestionnaire {
  unit: string
  unitFromZero: number[]
}

export interface Reminder {
  offset: TimeInterval
  notification?: Notification
}

export interface Notification {
  title?: MultiLanguageText
  text: MultiLanguageText
  vibrate?: boolean
  sound?: boolean
}
