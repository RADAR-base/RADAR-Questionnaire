import { QuestionnaireMetadata } from './assessment'
import { KafkaObject } from './kafka'
import { Task } from './task'

export interface CacheValue extends QuestionnaireMetadata {
  kafkaObject: KafkaObject
}

export interface OldCacheValue {
  task: Task
  cache: KafkaObject
}

export function instanceOfCacheValue(object: any) {
  return 'kafkaObject' in object
}
