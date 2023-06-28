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

  getKafkaPayload(
    type,
    kafkaObjects: any[],
    cacheKeys: any[],
    topic
  ): Promise<any> {
    return Promise.all([
      this.converterFactory
        .getConverter(SchemaType.KEY)
        .convertToRecord(kafkaObjects[0].key, topic),
      Promise.all(
        kafkaObjects.map(k => {
          return this.converterFactory
            .getConverter(type)
            .convertToRecord(k.value, topic)
        })
      )
    ]).then(([key, records]) => {
      return {
        type: kafkaObjects[0].name,
        topic: records[0].topic,
        cacheKey: cacheKeys,
        record: {
          key_schema_id: key.schema,
          value_schema_id: records[0].schema,
          records: records.map(r => ({ key: key.value, value: r.value }))
        }
      }
    })
  }
}
