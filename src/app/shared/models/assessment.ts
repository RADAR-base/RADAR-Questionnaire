import { Protocol } from './protocol'
import { Question } from './question'

export interface Assessment {
  warn?: string
  estimatedCompletionTime?: number
  name: string
  protocol: Protocol
  startText: string
  endText: string
  showIntroduction: boolean
  questions: Question[]
}
