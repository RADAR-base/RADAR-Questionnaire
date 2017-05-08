import { Protocol } from './protocol';
import { Question } from './question';

export interface Assessment {
  name: string,
  protocol: Protocol,
  questions: Question[]
}
