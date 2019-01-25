import { Injectable } from '@angular/core'
import * as KafkaRest from 'kafka-rest'

import {
  DefaultEndPoint,
  KAFKA_CLIENT_KAFKA
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { SchemaService } from './schema.service'

@Injectable()
export class KafkaService {
  private KAFKA_CLIENT_URL: string

  constructor(
    private storage: StorageService,
    private token: TokenService,
    private schema: SchemaService
  ) {
    this.updateURI()
  }

  updateURI() {
    this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const endPoint = uri ? uri : DefaultEndPoint
      this.KAFKA_CLIENT_URL = endPoint + KAFKA_CLIENT_KAFKA
    })
  }

  prepareKafkaObjectAndSend(type, payload) {
    const value = this.schema.getKafkaObjectValue(type, payload)
    const keyPromise = this.schema.getKafkaObjectKey()
    const specsPromise = this.schema.getSpecs(type, payload.task)
    return Promise.all([keyPromise, specsPromise]).then(([key, specs]) => {
      const kafkaObject = { key: key, value: value }
      return this.sendToCache(kafkaObject, specs)
    })
  }

  sendToCache(kafkaObject, specs) {
    this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      console.log('KAFKA-SERVICE: Caching answers.')
      cache[kafkaObject.value.time] = { kafkaObject: kafkaObject, specs: specs }
      this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
    })
  }

  sendToKafkaFromCache() {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache =>
      Object.entries(cache)
        .filter(([k, v]) => k)
        .slice(0, 20)
        .map(([k, v]) =>
          this.schema
            .convertToAvro(v['kafkaObject'], v['specs'])
            .then(
              data =>
                data &&
                this.sendToKafka(
                  v['specs'],
                  data.schemaId,
                  data.schemaInfo,
                  data.payload,
                  k
                )
            )
        )
    )
  }

  sendToKafka(specs, keySchema, valueSchema, payload, cacheKey) {
    return this.getKafkaInstance()
      .then(
        kafka =>
          new Promise((resolve, reject) => {
            // NOTE: Kafka connection instance to submit to topic
            const topic = specs.avsc + '_' + specs.name
            console.log('Sending to: ' + topic)
            return kafka
              .topic(topic)
              .produce(
                keySchema,
                valueSchema,
                payload,
                (err, res) => (err ? reject(err) : resolve(res))
              )
          })
      )
      .then(() => this.removeDataFromCache(cacheKey))
      .catch(error => {
        console.error(
          'Could not initiate kafka connection ' + JSON.stringify(error)
        )
        return Promise.resolve({ res: 'ERROR' })
      })
  }

  removeDataFromCache(cacheKey) {
    return this.storage.get(StorageKeys.CACHE_ANSWERS).then(cache => {
      console.log('Deleting ' + cacheKey)
      if (cache[cacheKey]) delete cache[cacheKey]
      return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
    })
  }

  getKafkaInstance() {
    return this.token
      .refresh()
      .then(() => this.storage.get(StorageKeys.OAUTH_TOKENS))
      .then(tokens => {
        const headers = { Authorization: 'Bearer ' + tokens.access_token }
        return new KafkaRest({ url: this.KAFKA_CLIENT_URL, headers: headers })
      })
  }
}
