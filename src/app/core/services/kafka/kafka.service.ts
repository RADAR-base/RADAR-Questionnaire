import { Injectable } from '@angular/core'
import * as KafkaRest from 'kafka-rest'

import { DefaultKafkaURI } from '../../../../assets/data/defaultConfig'
import { KafkaEventType } from '../../../shared/enums/events'
import { StorageKeys } from '../../../shared/enums/storage'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { FirebaseAnalyticsService } from '../usage/firebase-analytics.service'
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
    private firebaseAnalytics: FirebaseAnalyticsService,
    private logger: LogService,
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

  prepareKafkaObjectAndSend(type, payload, keepInCache?) {
    const value = this.schema.getKafkaObjectValue(type, payload)
    const keyPromise = this.schema.getKafkaObjectKey()
    const specsPromise = this.schema.getSpecs(type, payload.task)
    return Promise.all([keyPromise, specsPromise]).then(([key, specs]) => {
      const kafkaObject = { key: key, value: value }
      return this.storeInCache(kafkaObject, specs).then(() => {
        return keepInCache ? Promise.resolve() : this.sendAllFromCache()
      })
    })
  }

  storeInCache(kafkaObject, specs) {
    return this.getCache().then(cache => {
      console.log('KAFKA-SERVICE: Caching answers.')
      cache[kafkaObject.value.time] = Object.assign({}, specs, { kafkaObject })
      return this.setCache(cache)
    })
  }

  sendAllFromCache() {
    if (!this.isCacheSending) {
      this.setCacheSending(true)
      return Promise.all([
        this.getCache(),
        this.getKafkaInstance(),
      ])
        .then(([cache, kafka]) => {
          const sendPromises = Object.entries(cache)
            .filter(([k]) => k)
            .map(([k, v]: any) => this.sendToKafka(k, v, kafka)
              .catch(e => {
                this.logger.error('Failed to send data from cache to kafka', e)
                return undefined
              }))

          return Promise.all(sendPromises)
        })
        .then(keys => {
          this.logger.log(keys)
          return this.removeFromCache(keys.filter(k => k))
        })
        .then(() => {
          this.setCacheSending(false)
          return this.setLastUploadDate(Date.now())
        })
        .catch(e => {
          this.logger.error('Failed to send all data from cache', e)
          this.setCacheSending(false)
        })
    } else {
      return Promise.resolve()
    }
  }

  sendToKafka(k, v, kafka): Promise<any> {
    return this.schema
      .getKafkaTopic(v.name, v.avsc)
      .then(topic =>
        this.schema
          .convertToAvro(v.kafkaObject, topic, this.BASE_URI)
          .then(data =>
            kafka
              .topic(topic)
              .produce(data.schemaId, data.schemaInfo, data.payload, e =>
                e ? Promise.reject() : Promise.resolve()
              )
          )
      )
      .then(() => this.sendKafkaEvent(KafkaEventType.SEND_SUCCESS, v))
      .then(() => k)
      .catch(error => {
        this.sendKafkaEvent(KafkaEventType.SEND_ERROR, v, JSON.stringify(error))
        throw error
      })
  }

  removeFromCache(cacheKeys: number[]) {
    return this.getCache()
      .then(cache => {
        if (cache) {
          cacheKeys.map(cacheKey => {
            if (cache[cacheKey]) {
              console.log('Deleting ' + cacheKey)
              delete cache[cacheKey]
            }
          })
          return this.setCache(cache)
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
      .catch(e => {
        throw this.logger.error('Could not initiate kafka connection', e)
      })
  }

  setCache(cache) {
    return this.storage.set(this.KAFKA_STORE.CACHE_ANSWERS, cache)
  }

  setCacheSending(val: boolean) {
    this.isCacheSending = val
  }

  setLastUploadDate(date) {
    return this.storage.set(this.KAFKA_STORE.LAST_UPLOAD_DATE, date)
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

  sendKafkaEvent(type, cacheValue, error?) {
    this.firebaseAnalytics.logEvent(type, {
      name: cacheValue.name,
      questionnaire_timestamp: String(cacheValue.kafkaObject.time),
      error: JSON.stringify(error)
    })
  }

  reset() {
    return Promise.all([this.setCache({}), this.setLastUploadDate(null)])
  }
}
