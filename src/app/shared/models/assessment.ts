import { Protocol } from './protocol'
import { Question } from './question'
import { MultiLanguageText } from './text'

export interface Assessment {
  estimatedCompletionTime?: number;
  name: string
  protocol: Protocol
  startText?: MultiLanguageText
  endText?: MultiLanguageText
  warn?: MultiLanguageText;
  showIntroduction?: boolean
  questions: Question[]
}
