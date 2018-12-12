import { Protocol } from './protocol'
import { Question } from './question'

export interface Assessment {
  warn: string | null
  estimatedCompletionTime: number | null
  name: string
  protocol: Protocol
  startText: string
  endText: string
  showIntroduction: boolean
  questions: Question[]
}
