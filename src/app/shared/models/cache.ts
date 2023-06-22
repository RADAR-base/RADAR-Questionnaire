import { QuestionnaireMetadata } from './assessment'
import { KafkaObject } from './kafka'

export interface CacheValue extends QuestionnaireMetadata {
  kafkaObject: KafkaObject
}

export interface KeyValue {
  key: any
  value: CacheValue
}
