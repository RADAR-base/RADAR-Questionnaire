export interface Protocol {
  repeatProtocol: RepeatProtocol
  repeatQuestionnaire: RepeatQuestionnaire
  reminders: Reminders
  completionWindow: TimeInterval
}

export interface TimeInterval {
  unit?: string
  amount?: number
}

export interface RepeatProtocol {
  unit: string
  amount: number
}

export interface RepeatQuestionnaire {
  unit: string
  unitFromZero: number[]
}

export interface Reminders {
  unit: string
  amount: number
  repeat: number
}
