import { Protocol } from './protocol'
import { Question } from './question'

export interface Assessment {
  name: string,
  protocol: Protocol,
  startText: string,
  endText: string,
  showIntroduction: boolean,
  questions: Question[]
}
