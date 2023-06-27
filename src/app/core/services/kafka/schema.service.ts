import { Injectable } from '@angular/core'

import {
  KeyExport,
  SchemaMetadata,
  SchemaType
} from '../../../shared/models/kafka'
import { SubjectConfigService } from '../config/subject-config.service'
import { ConverterFactoryService } from './converters/converter-factory.service.'

@Injectable()
export class SchemaService {
  constructor(
    private converterFactory: ConverterFactoryService,
    private subjectConfig: SubjectConfigService
  ) {}

  getKafkaObjectKey() {
    return this.subjectConfig
      .getKafkaObservationKey()
      .then(
        payload =>
          <KeyExport>(
            this.converterFactory
              .getConverter(SchemaType.KEY)
              .processData(payload)
          )
      )
  }

  getKafkaObjectValue(type, payload) {
    return this.converterFactory.getConverter(type).processData(payload)
  }

  getKafkaPayload(kafkaObject: any[], cacheKey, topic): Promise<any> {
    return Promise.all([
      this.converterFactory
        .getConverter(SchemaType.KEY)
        .convertToRecord(kafkaObject[0], topic),
      Promise.all(
        kafkaObject.map(k => {
          return this.converterFactory
            .getConverter(k.name)
            .convertToRecord(k, topic)
        })
      )
    ]).then(([key, records]) => {
      return {
        type: kafkaObject[0].name,
        topic: records[0].topic,
        cacheKey: cacheKey,
        record: {
          key_schema_id: key.schema,
          value_schema_id: records[0].schema,
          records: records.map(r => ({ key: key.value, value: r.value }))
        }
      }
    })
  }
}
