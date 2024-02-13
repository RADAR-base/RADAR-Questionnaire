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
    kafkaKey,
    kafkaObjects: any[],
    cacheKeys: any[],
    topics
  ): Promise<any> {
    const valueConverter = this.converterFactory.getConverter(type)
    return valueConverter.getKafkaTopic(kafkaObjects[0], topics).then(topic =>
      valueConverter.getSchemas(topic).then(schema => {
        return Promise.all([
          this.converterFactory
            .getConverter(SchemaType.KEY)
            .convertToRecord(kafkaKey, topic, ''),
          valueConverter.batchConvertToRecord(kafkaObjects, topic, schema)
        ]).then(([key, records]) => ({
          topic,
          cacheKey: cacheKeys,
          record: {
            key_schema_id: key.schema,
            value_schema_id: records[0]['schema'],
            records: records.map(r => ({ key: key.value, value: r['value'] }))
          }
        }))
      })
    )
  }
}
