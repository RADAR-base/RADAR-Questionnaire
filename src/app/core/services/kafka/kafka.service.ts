import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as pako from 'pako'

import {
  DefaultClientAcceptType,
  DefaultCompressedContentEncoding,
  DefaultKafkaRequestContentType,
  DefaultKafkaURI,
  DefaultRequestJSONContentType
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { DataEventType } from '../../../shared/enums/events'
import { StorageKeys } from '../../../shared/enums/storage'
import { CacheValue, KeyValue } from '../../../shared/models/cache'
import { KafkaObject, SchemaType } from '../../../shared/models/kafka'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'
import { AnalyticsService } from '../usage/analytics.service'
import { CacheService } from './cache.service'
import { SchemaService } from './schema.service'

@Injectable()
export class KafkaService {
  private static DEFAULT_TOPIC_CACHE_VALIDITY = 600_000 // 10 minutes

  URI_topics: string = '/topics/'
  DEFAULT_KAFKA_AVSC = 'questionnaire'

  private KAFKA_CLIENT_URL: string
  private isCacheSending: boolean
  private topics: string[] = null
  private lastTopicFetch: number = 0
  private TOPIC_CACHE_VALIDITY = KafkaService.DEFAULT_TOPIC_CACHE_VALIDITY
  HTTP_ERROR = 'HttpErrorResponse'

  constructor(
    private storage: StorageService,
    private cache: CacheService,
    private token: TokenService,
    private schema: SchemaService,
    private analytics: AnalyticsService,
    private logger: LogService,
    private http: HttpClient,
    private remoteConfig: RemoteConfigService
  ) {
    this.updateURI()
    this.readTopicCacheValidity()
  }

  init() {
    return Promise.all([
      this.cache.setCache({}),
      this.updateTopicCacheValidity(),
      this.fetchTopics()
    ])
  }

  updateURI() {
    return this.token
      .getURI()
      .then(uri => (this.KAFKA_CLIENT_URL = uri + DefaultKafkaURI))
  }

  readTopicCacheValidity() {
    return this.storage.get(StorageKeys.TOPIC_CACHE_TIMEOUT).then(timeout => {
      if (typeof timeout === 'number') {
        this.TOPIC_CACHE_VALIDITY = timeout
      }
    })
  }

  updateTopicCacheValidity() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.TOPIC_CACHE_TIMEOUT,
          this.TOPIC_CACHE_VALIDITY.toString()
        )
      )
      .then(timeoutString => {
        const timeout = parseInt(timeoutString)
        if (!isNaN(timeout)) {
          this.TOPIC_CACHE_VALIDITY = Math.max(0, timeout)
          return this.storage.set(
            StorageKeys.TOPIC_CACHE_TIMEOUT,
            this.TOPIC_CACHE_VALIDITY
          )
        }
      })
  }

  private fetchTopics() {
    return this.getKafkaHeaders(DefaultRequestJSONContentType)
      .then(headers =>
        this.http
          .get(this.KAFKA_CLIENT_URL + this.URI_topics, {
            headers,
            observe: 'body'
          })
          .toPromise()
      )
      .then((topics: string[]) => {
        this.topics = topics
        this.lastTopicFetch = Date.now()
        return topics
      })
      .catch(e => {
        this.logger.error('Failed to fetch Kafka topics', e)
        return this.topics
      })
  }

  getTopics() {
    if (
      this.topics !== null ||
      this.lastTopicFetch + this.TOPIC_CACHE_VALIDITY >= Date.now()
    ) {
      return Promise.resolve(this.topics)
    } else {
      return this.fetchTopics()
    }
  }

  prepareKafkaObjectAndStore(type, payload) {
    const name = type == SchemaType.ASSESSMENT ? payload.metadata.name : type
    const value = this.schema.getKafkaObjectValue(type, payload)
    const kafkaObject: KafkaObject = { value }
    const cacheValue: CacheValue = {
      kafkaObject,
      name,
      avsc: payload.metadata ? payload.metadata.avsc : this.DEFAULT_KAFKA_AVSC
    }
    this.sendDataEvent(
      DataEventType.PREPARED_OBJECT,
      name,
      kafkaObject.value.name,
      kafkaObject.value.timestamp
    )
    return this.cache.storeInCache(kafkaObject, cacheValue)
  }

  sendAllFromCache(): Promise<any> {
    const successKeys = []
    const failedKeys = []
    if (this.isCacheSending) return Promise.resolve([])
    this.cache.setCacheSending(true)
    return Promise.all([
      this.cache.getCache(),
      this.getKafkaHeaders(DefaultKafkaRequestContentType)
    ])
      .then(([cache, headers]) => {
        return this.convertCacheToRecords(cache).then(records => {
          return Promise.all(
            records.map(r =>
              this.sendToKafka(r.type, r.topic, r.record, headers)
                .then(() => successKeys.push(r.cacheKey))
                .catch(e => {
                  failedKeys.push(r.cacheKey)
                  return this.logger.error(
                    'Failed to send data from cache to kafka',
                    e
                  )
                })
            )
          )
        })
      })
      .then(() =>
        this.cache.removeFromCache(successKeys).then(() => {
          this.cache.setCacheSending(false)
          return { successKeys, failedKeys }
        })
      )
      .catch(e => {
        this.cache.setCacheSending(false)
        return [this.logger.error('Failed to send all data from cache', e)]
      })
  }

  convertCacheToRecords(cache) {
    // what we can do here is group similar
    return this.schema.getKafkaObjectKey().then(key => {
      const groupedCache = {}
      Object.entries(cache).map(([k, v]) => {
        const type = v['name']
        if (!groupedCache[type]) groupedCache[type] = []
        groupedCache[type].push({
          key: k,
          value: { key, value: v['kafkaObject'].value }
        })
      })
      // after grouping similar convert to array of records
      const records = Object.entries(groupedCache).map(([k, v]: [any, any]) => {
        return this.schema.getKafkaPayload(
          k,
          v.map(v => v.value),
          v.map(v => v.key),
          this.topics
        )
      })

      return Promise.all(records)
    })
  }

  sendToKafka(type, topic, record, headers): Promise<any> {
    const allRecords = record.records
    return this.http
      .post(this.KAFKA_CLIENT_URL + this.URI_topics + topic, record, {
        headers
      })
      .toPromise()
      .then(() =>
        allRecords.map(r =>
          this.sendDataEvent(
            DataEventType.SEND_SUCCESS,
            type,
            r.name ? r.value.name : r.value.questionnaireName,
            r.time
          )
        )
      )
      .catch(e => {
        allRecords.map(r =>
          this.sendDataEvent(
            DataEventType.SEND_ERROR,
            type,
            r.name ? r.value.name : r.value.questionnaireName,
            r.time,
            JSON.stringify(e)
          )
        )
        throw e
      })
  }

  removeFromHealthCache(cacheKeys: number[]) {
    if (!cacheKeys.length) return Promise.resolve()
    return this.storage
      .removeHealthData(cacheKeys)
      .then(() => this.setLastUploadDate(Date.now()))
  }

  getAccessToken() {
    return Promise.all([this.updateURI(), this.token.refresh()])
      .then(() => this.token.getTokens())
      .then(tokens => tokens.access_token)
  }

  getKafkaHeaders(contentType) {
    return this.getAccessToken()
      .then(accessToken =>
        new HttpHeaders()
          .set('Authorization', 'Bearer ' + accessToken)
          .set('Content-Type', contentType)
          .set('Accept', DefaultClientAcceptType)
      )
      .catch(e => {
        throw this.logger.error('Could not create kafka headers', e)
      })
  }

  setCache(cache) {
    return this.storage.set(StorageKeys.CACHE_ANSWERS, cache)
  }

  setHealthCache(cache) {
    return this.storage.setHealthData(cache)
  }

  resetHealthCache() {
    return this.storage.resetHealthData()
  }

  setCacheSending(val: boolean) {
    this.isCacheSending = val
  }

  setLastUploadDate(date) {
    return this.storage.set(StorageKeys.LAST_UPLOAD_DATE, date)
  }

  setHealthkitPollTimes(dic) {
    return this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, dic)
  }

  getHealthCache() {
    return this.storage.getHealthData(StorageKeys.HEALTHKIT_CACHE)
  }

  getLastUploadDate() {
    return this.cache.getLastUploadDate()
  }

  getHealthCacheSize() {
    return this.getHealthCache().then(cache =>
      Object.keys(cache).reduce((s, k) => (k ? s + 1 : s), 0)
    )
  }

  getCacheSize() {
    return this.cache.getCacheSize()
  }

  sendDataEvent(type, name, questionnaire, timestamp, error?) {
    this.analytics.logEvent(type, {
      name,
      questionnaire_name: questionnaire,
      questionnaire_timestamp: String(timestamp),
      error: JSON.stringify(error)
    })
  }

  reset() {
    return this.cache.reset()
  }
}
