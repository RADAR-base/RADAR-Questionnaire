import { QuestionnaireMetadata } from './assessment'
import { KafkaObject } from './kafka'

export interface CacheValue extends QuestionnaireMetadata {
  kafkaObject: KafkaObject
}
