import { Injectable } from '@angular/core'
import * as KafkaRest from 'kafka-rest'

import { DefaultKafkaURI } from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { FirebaseAnalyticsService } from '../usage/firebaseAnalytics.service'
import { SchemaService } from './schema.service'

@Injectable()
export class KafkaService {
  private readonly KAFKA_STORE = {
    LAST_UPLOAD_DATE: StorageKeys.LAST_UPLOAD_DATE,
    CACHE_ANSWERS: StorageKeys.CACHE_ANSWERS
  }
  private KAFKA_CLIENT_URL: string
  private BASE_URI: string
  private isCacheSending: boolean

  constructor(
    private storage: StorageService,
    private token: TokenService,
    private schema: SchemaService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {
    this.token.refresh()
    this.updateURI()
  }

  init() {
    return this.setCache({})
  }

  updateURI() {
    this.token.getURI().then(uri => {
      this.BASE_URI = uri
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
        const cacheEntries = Object.entries(cache)
        if (!cacheEntries.length) return Promise.resolve({})
        else
          return this.getKafkaInstance().then(kafka => {
            const promises = !cacheEntries.length
              ? [Promise.resolve()]
              : this.startSending(cacheEntries, kafka)
            this.setCacheSending(false)
            return Promise.all(promises).then(keys => {
              this.removeDataFromCache(keys.filter(k => k))
              return this.setLastUploadDate()
            })
          })
      })
    } else {
      Promise.resolve()
    }
  }

  startSending(entries, kafka): Promise<any>[] {
    return entries
      .filter(([k]) => k)
      .slice(0, 20)
      .map(([k, v]: any) => {
        const timestamp = v.specs.task ? v.specs.task.timestamp : Date.now()
        return this.schema
          .convertToAvro(v.kafkaObject, v.specs, this.BASE_URI)
          .then(data =>
            this.sendToKafka(
              v.specs,
              data.schemaId,
              data.schemaInfo,
              data.payload,
              k,
              kafka
            )
          )
          .then(key => {
            this.firebaseAnalytics.logEvent('send_success', {
              name: v.specs.name,
              questionnaire_timestamp: String(timestamp)
            })
            return Promise.resolve(key)
          })
          .catch(error => {
            console.error(
              'Could not initiate kafka connection ' + JSON.stringify(error)
            )
            this.firebaseAnalytics.logEvent('send_error', {
              error: JSON.stringify(error),
              name: v.specs.name,
              questionnaire_timestamp: String(timestamp)
            })
            return Promise.resolve(0)
          })
      })
  }

  sendToKafka(specs, keySchema, valueSchema, payload, cacheKey, kafka) {
    const topic = specs.avsc + '_' + specs.name
    console.log('Sending to: ' + topic)
    return new Promise((resolve, reject) => {
      // NOTE: Kafka connection instance to submit to topic
      return kafka
        .topic(topic)
        .produce(
          keySchema,
          valueSchema,
          payload,
          err => (err ? reject(err) : resolve(cacheKey))
        )
    }).then(() => this.removeDataFromCache(cacheKey))
  }

  removeDataFromCache(cacheKeys: number[]) {
    return this.getCache().then(cache => {
      if (cache) {
        cacheKeys.map(cacheKey => {
          if (cache[cacheKey]) {
            console.log('Deleting ' + cacheKey)
            delete cache[cacheKey]
          }
        })
        return this.setCache(cache)
      } else {
        return Promise.resolve()
      }
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
