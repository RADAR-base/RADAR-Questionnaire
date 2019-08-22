import { Protocol } from './protocol'
import { Question } from './question'
import { MultiLanguageText } from './text'

export interface Assessment {
  questionnaire?: QuestionnaireMetadata
  estimatedCompletionTime?: number
  name: string
  protocol: Protocol
  startText?: MultiLanguageText
  endText?: MultiLanguageText
  warn?: MultiLanguageText
  showIntroduction?: boolean
  questions: Question[]
}

export interface QuestionnaireMetadata {
  repository?: string
  name: string
  avsc: string
  type?: string
  format?: string
}
