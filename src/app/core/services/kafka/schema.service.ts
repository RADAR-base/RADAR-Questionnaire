import { Injectable } from '@angular/core'

import {
  KeyExport,
  SchemaMetadata,
  SchemaType
} from '../../../shared/models/kafka'
import { SubjectConfigService } from '../config/subject-config.service'
import { ConverterFactoryService } from './converters/converter-factory.service.'
import { KeyConverterService } from './converters/key-converter.service'
import { Platform } from '@ionic/angular'
import { Observable } from 'rxjs'

@Injectable()
export class SchemaService {
  constructor(
    private converterFactory: ConverterFactoryService,
    private subjectConfig: SubjectConfigService,
    public keyConverter: KeyConverterService,
    private platform: Platform
  ) {
    this.platform.ready().then(() => {
      this.init()
    })
  }

  init() {
    this.converterFactory.init()
  }

  getKafkaObjectKey() {
    return this.subjectConfig
      .getKafkaObservationKey()
      .then(
        payload =>
          <KeyExport>(
            this.keyConverter.processData(payload)
          )
      )
  }

  getKafkaObjectValue(type, payload) {
    return this.converterFactory.getConverter(type).processData(payload)
  }

  getKafkaPayload(
    type,
    kafkaKey,
    kafkaObject: any,
    cacheKey: string,
    topics,
    options?: any
  ): Promise<any> | Observable<any> {
    return this.converterFactory
      .getConverter(type)
      .getKafkaPayload(type, kafkaKey, kafkaObject, cacheKey, topics, options)
  }

  reset() {
    return this.converterFactory.reset()
  }
}
