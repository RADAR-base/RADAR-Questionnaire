import { Injectable } from '@angular/core'
import * as KafkaRest from 'kafka-rest'

import { DefaultKafkaURI } from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { SchemaService } from './schema.service'

@Injectable()
export class KafkaService {
  private readonly KAFKA_STORE = {
    LAST_UPLOAD_DATE: StorageKeys.LAST_UPLOAD_DATE,
    CACHE_ANSWERS: StorageKeys.CACHE_ANSWERS
  }
  private KAFKA_CLIENT_URL: string
  private isCacheSending: boolean

  constructor(
    private storage: StorageService,
    private token: TokenService,
    private schema: SchemaService
  ) {
    this.token.refresh()
  }

  init() {
    return this.setCache({})
  }

  updateURI() {
    this.token.getURI().then(uri => {
      this.KAFKA_CLIENT_URL = uri + DefaultKafkaURI
    })
  }

  prepareKafkaObjectAndSend(type, payload) {
    const value = this.schema.getKafkaObjectValue(type, payload)
    const keyPromise = this.schema.getKafkaObjectKey()
    const specsPromise = this.schema.getSpecs(type, payload.task)
    return Promise.all([keyPromise, specsPromise]).then(([key, specs]) => {
      const kafkaObject = { key: key, value: value }
      return this.sendToCache(kafkaObject, specs).then(() =>
        this.sendToKafkaFromCache()
      )
    })
  }

  sendToCache(kafkaObject, specs) {
    return this.getCache().then(cache => {
      console.log('KAFKA-SERVICE: Caching answers.')
      cache[kafkaObject.value.time] = { kafkaObject: kafkaObject, specs: specs }
      return this.setCache(cache)
    })
  }

  sendToKafkaFromCache() {
    if (!this.isCacheSending) {
      this.setCacheSending(true)
      this.getCache().then(cache => {
        const promises = Object.entries(cache)
          .filter(([k]) => k)
          .slice(0, 20)
          .map(([k, v]: any) =>
            this.schema
              .convertToAvro(v.kafkaObject, v.specs)
              .then(
                data =>
                  data &&
                  this.sendToKafka(
                    v.specs,
                    data.schemaId,
                    data.schemaInfo,
                    data.payload,
                    k
                  )
              )
          )
        Promise.all(promises).then(() => this.setCacheSending(false))
      })
    }
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
      .then(() => this.setLastUploadDate())
      .catch(error => {
        console.error(
          'Could not initiate kafka connection ' + JSON.stringify(error)
        )
        return Promise.resolve({ res: 'ERROR' })
      })
  }

  removeDataFromCache(cacheKey) {
    return this.getCache().then(cache => {
      console.log('Deleting ' + cacheKey)
      if (cache[cacheKey]) delete cache[cacheKey]
      return this.setCache(cache)
    })
  }

  getKafkaInstance() {
    return Promise.all([this.updateURI(), this.token.refresh()])
      .then(() => this.token.getTokens())
      .then(tokens => {
        const headers = { Authorization: 'Bearer ' + tokens.access_token }
        return new KafkaRest({ url: this.KAFKA_CLIENT_URL, headers: headers })
      })
  }

  setCache(cache) {
    return this.storage.set(this.KAFKA_STORE.CACHE_ANSWERS, cache)
  }

  setCacheSending(val: boolean) {
    this.isCacheSending = val
  }

  setLastUploadDate() {
    return this.storage.set(this.KAFKA_STORE.LAST_UPLOAD_DATE, Date.now())
  }

  getCache() {
    return this.storage.get(this.KAFKA_STORE.CACHE_ANSWERS)
  }

  getLastUploadDate() {
    return this.storage.get(this.KAFKA_STORE.LAST_UPLOAD_DATE)
  }

  getCacheSize() {
    return this.storage
      .get(this.KAFKA_STORE.CACHE_ANSWERS)
      .then(cache => Object.keys(cache).reduce((s, k) => (k ? s + 1 : s), 0))
  }
}
