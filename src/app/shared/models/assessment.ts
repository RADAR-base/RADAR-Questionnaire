import { Protocol } from './protocol'
import { Question } from './question'
import { Task } from './task'
import { MultiLanguageText } from './text'

export interface Assessment {
  questionnaire?: QuestionnaireMetadata
  estimatedCompletionTime?: number
  name: string
  type?: AssessmentType
  protocol: Protocol
  startText?: MultiLanguageText
  endText?: MultiLanguageText
  warn?: MultiLanguageText
  showIntroduction?: boolean | ShowIntroductionType
  isDemo?: boolean
  questions: Question[]
  showInCalendar?: boolean
  order?: number
  requiresInClinicCompletion?: boolean
}

export interface QuestionnaireMetadata {
  repository?: string
  name: string
  avsc?: string
  type?: string
  format?: string
}

export enum ShowIntroductionType {
  ALWAYS = 'always',
  ONCE = 'once',
  NEVER = 'never'
}

export enum AssessmentType {
  ON_DEMAND = 'on_demand',
  SCHEDULED = 'scheduled',
  CLINICAL = 'clinical',
  ALL = 'all'
}

export interface SchedulerResult {
  schedule: Task[]
  completed: Task[]
}
