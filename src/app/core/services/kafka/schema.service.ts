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

  getKafkaPayload(cache, cacheKey, topics): Promise<any> {
    return Promise.all([
      this.converterFactory
        .getConverter(SchemaType.KEY)
        .convertToRecord(cache, topics),
      this.converterFactory
        .getConverter(cache.name)
        .convertToRecord(cache, topics)
    ]).then(([key, avro]) => {
      return {
        type: cache.name,
        topic: avro.topic,
        cacheKey: cacheKey,
        record: {
          key_schema_id: key.schema,
          value_schema_id: avro.schema,
          records: [{ key: key.value, value: avro.value }]
        }
      }
    })
  }
}
