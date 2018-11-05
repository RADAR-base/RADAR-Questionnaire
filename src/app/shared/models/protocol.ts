export interface Protocol {
  repeatProtocol: RepeatProtocol
  repeatQuestionnaire: RepeatQuestionnaire
  reminders: Reminders
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
