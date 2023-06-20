import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as pako from 'pako'

import {
  DefaultClientAcceptType,
  DefaultKafkaRequestContentType,
  DefaultKafkaURI
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
import { SchemaService } from './schema.service'

@Injectable()
export class KafkaService {
  private static DEFAULT_TOPIC_CACHE_VALIDITY = 600_000 // 10 minutes

  URI_topics: string = '/topics/'

  private readonly KAFKA_STORE = {
    LAST_UPLOAD_DATE: StorageKeys.LAST_UPLOAD_DATE,
    CACHE_ANSWERS: StorageKeys.CACHE_ANSWERS
  }
  private KAFKA_CLIENT_URL: string
  private BASE_URI: string
  private isCacheSending: boolean
  private topics: string[] = null
  private lastTopicFetch: number = 0
  private TOPIC_CACHE_VALIDITY = KafkaService.DEFAULT_TOPIC_CACHE_VALIDITY

  constructor(
    private storage: StorageService,
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
      this.setCache({}),
      this.updateTopicCacheValidity(),
      this.fetchTopics()
    ])
  }

  updateURI() {
    return this.token.getURI().then(uri => {
      this.BASE_URI = uri
      this.KAFKA_CLIENT_URL = uri + DefaultKafkaURI
    })
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
    return this.getAccessToken()
      .then(accessToken =>
        this.http
          .get(this.KAFKA_CLIENT_URL + this.URI_topics, {
            observe: 'body',
            headers: new HttpHeaders()
              .set('Authorization', 'Bearer ' + accessToken)
              .set('Accept', DefaultClientAcceptType)
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

  prepareKafkaObjectAndSend(type, payload, keepInCache?): Promise<CacheValue> {
    const value = this.schema.getKafkaObjectValue(type, payload)
    const keyPromise = this.schema.getKafkaObjectKey()
    const metaDataPromise = this.schema.getMetaData(type, payload)
    return Promise.all([keyPromise, metaDataPromise]).then(
      ([key, metaData]) => {
        const kafkaObject: KafkaObject = { key: key, value: value }
        const cacheValue: CacheValue = Object.assign({}, metaData, {
          kafkaObject
        })
        return cacheValue
      }
    )
  }

  storeInCache(cacheValue: CacheValue) {
    return this.getCache().then(cache => {
      console.log('KAFKA-SERVICE: Caching answers.')
      const kafkaObjectVal = cacheValue.kafkaObject.value
      const cacheKey = kafkaObjectVal.time
        ? kafkaObjectVal.time
        : kafkaObjectVal.startTime
      cache[cacheKey] = cacheValue
      this.sendDataEvent(DataEventType.CACHED, cacheValue)
      return this.setCache(cache)
    })
  }

  storeHealthDataInCache(cacheValue: CacheValue[]) {
    return this.getHealthCache().then(cache => {
      cache = cache ? cache : {}
      cacheValue.map((c: CacheValue) => {
        console.log('KAFKA-SERVICE: Caching answers.')
        const kafkaObjectVal = c.kafkaObject.value
        const cacheKey = kafkaObjectVal.startTime
          ? kafkaObjectVal.startTime + Math.random()
          : kafkaObjectVal.time
        cache[cacheKey] = c
      })
      return this.setHealthCache(cache)
    })
  }

  sendAllFromCache() {
    if (this.isCacheSending) return Promise.resolve([])
    this.setCacheSending(true)
    return Promise.all([
      this.getCache(),
      this.getHealthCache(),
      this.getKafkaHeaders(),
      this.schema.getRadarSpecifications(),
      this.getTopics()
    ])
      .then(([cache, healthCache, headers, specifications, topics]) => {
        const cacheByTopics = {}
        const completeCache = Object.entries(
          Object.assign({}, cache, healthCache)
        ).filter(([k, v]) => k && v)
        const sendPromises = completeCache.map(([k, v]: any) =>
          this.schema
            .getKafkaTopic(specifications, v.name, v.avsc, topics)
            .then(topic => {
              if (!cacheByTopics[topic]) cacheByTopics[topic] = []
              return cacheByTopics[topic].push({ key: k, value: v })
            })
        )
        return Promise.all(sendPromises).then(res => {
          const keys = Object.keys(cacheByTopics)
          return Promise.all(
            keys.map(k =>
              this.sendToKafka(k, cacheByTopics[k], headers).catch(e => e)
            )
          )
        })
      })
      .then((keys: any[][]) => {
        const allKeys = [].concat.apply([], keys)
        const successKeys = allKeys.filter(k => !(k instanceof Error))
        return this.removeFromCache(successKeys)
          .then(() => this.removeFromHealthCache(successKeys))
          .then(() => this.setCacheSending(false))
          .then(() => allKeys)
      })
      .catch(e => {
        this.setCacheSending(false)
        return [this.logger.error('Failed to send all data from cache', e)]
      })
  }

  sendToKafka(topic: string, values: KeyValue[], headers): Promise<any[]> {
    const kafkaObjects = values.map(v => v.value.kafkaObject)
    return this.schema
      .getKafkaPayload(kafkaObjects, topic, this.BASE_URI)
      .then(data => {
        const compressed = pako.gzip(JSON.stringify(data)).buffer
        return this.http
          .post(this.KAFKA_CLIENT_URL + this.URI_topics + topic, compressed, {
            headers
          })
          .toPromise()
      })
      .then(() =>
        values.map(v => this.sendDataEvent(DataEventType.SEND_SUCCESS, v.value))
      )
      .then(() => values.map(v => v.key))
      .catch(error => {
        values.map(v =>
          this.sendDataEvent(
            DataEventType.SEND_ERROR,
            v.value,
            JSON.stringify(error)
          )
        )
        throw error
      })
  }

  removeFromCache(cacheKeys: number[]) {
    if (!cacheKeys.length) return Promise.resolve()
    return this.getCache().then(cache => {
      if (cache) {
        cacheKeys.map(cacheKey => {
          if (cache[cacheKey]) {
            this.sendDataEvent(
              DataEventType.REMOVED_FROM_CACHE,
              cache[cacheKey]
            )
            console.log('Deleting ' + cacheKey)
            delete cache[cacheKey]
          }
        })
        this.setLastUploadDate(Date.now())
        return this.setCache(cache)
      }
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

  getKafkaHeaders() {
    return this.getAccessToken()
      .then(accessToken =>
        new HttpHeaders()
          .set('Authorization', 'Bearer ' + accessToken)
          .set('Content-Encoding', 'gzip')
          .set('Content-Type', DefaultKafkaRequestContentType)
          .set('Accept', DefaultClientAcceptType)
      )
      .catch(e => {
        throw this.logger.error('Could not create kafka headers', e)
      })
  }

  setCache(cache) {
    return this.storage.set(this.KAFKA_STORE.CACHE_ANSWERS, cache)
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
    return this.storage.set(this.KAFKA_STORE.LAST_UPLOAD_DATE, date)
  }

  setHealthkitPollTimes(dic) {
    return this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, dic)
  }

  getCache() {
    return this.storage.get(this.KAFKA_STORE.CACHE_ANSWERS)
  }

  getHealthCache() {
    return this.storage.getHealthData(this.KAFKA_STORE.CACHE_ANSWERS)
  }

  getLastUploadDate() {
    return this.storage.get(this.KAFKA_STORE.LAST_UPLOAD_DATE)
  }

  getHealthCacheSize() {
    return this.getHealthCache().then(cache =>
      Object.keys(cache).reduce((s, k) => (k ? s + 1 : s), 0)
    )
  }

  getCacheSize() {
    return this.storage
      .get(this.KAFKA_STORE.CACHE_ANSWERS)
      .then(cache => Object.keys(cache).reduce((s, k) => (k ? s + 1 : s), 0))
  }

  sendDataEvent(type, cacheValue: CacheValue, error?) {
    const value = cacheValue.kafkaObject.value
    this.analytics.logEvent(type, {
      name: cacheValue.repository ? SchemaType.ASSESSMENT : cacheValue.name,
      timestamp: String(value.time),
      questionnaire_name: value.name,
      questionnaire_timestamp: String(value.timeNotification),
      error: JSON.stringify(error)
    })
  }

  reset() {
    return Promise.all([
      this.setCache({}),
      this.resetHealthCache(),
      this.setLastUploadDate(null),
      this.setHealthkitPollTimes({})
    ])
  }
}
