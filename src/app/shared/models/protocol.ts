import { MultiLanguageText } from './text'

export interface ClinicalProtocol {
  requiresInClinicCompletion?: boolean
  repeatAfterClinicVisit: RepeatQuestionnaire
}

export interface Protocol {
  notification?: ProtocolNotification
  repeatProtocol: TimeInterval
  repeatQuestionnaire: RepeatQuestionnaire
  reminders?: Reminder[] | Reminders
  clinicalProtocol?: ClinicalProtocol
  onDemandProtocol?
  completionWindow?: TimeInterval
  referenceTimestamp?: string | ProtocolReferenceTimestamp
  metaData?: ProtocolEventMetaData
}

export interface ProtocolReferenceTimestamp {
  timestamp: string
  format: ReferenceTimestampFormat
}

export enum ReferenceTimestampFormat {
  DATE = 'date',
  DATETIME = 'datetime',
  DATETIMEUTC = 'datetimeutc',
  TODAY = 'today',
  NOW = 'now'
}

export enum TaskState {
  ADDED = 'ADDED',
  UPDATED = 'UPDATED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED'
}

export interface ProtocolMetaData {
  protocol: string
  url?: string
}

export interface ProtocolEventMetaData {
  series?: string
  prefix?: string
  displayTemplate?: string
}

export enum ProtocolDisplayTemplateKey {
  NAME = 'name',
  PREFIX = 'prefix',
  AUTO_INDEX = 'autoIndex',
  SERIES = 'series'
}

export interface TimeInterval {
  unit?: string
  amount?: number
}

export interface RepeatQuestionnaire {
  unit: string
  unitsFromZero: number[]
}

export interface Reminder {
  offset: TimeInterval
  notification?: ProtocolNotification
}

export interface Reminders extends TimeInterval {
  repeat?: number
}

export interface ProtocolNotification {
  title?: MultiLanguageText
  text?: MultiLanguageText
  vibrate?: boolean
  sound?: boolean
}
