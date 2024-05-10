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
import { Subject } from 'rxjs'

@Injectable()
export class KafkaService {
  private static DEFAULT_TOPIC_CACHE_VALIDITY = 600_000 // 10 minutes

  URI_topics: string = '/topics/'
  DEFAULT_KAFKA_AVSC = 'questionnaire'

  private KAFKA_CLIENT_URL: string
  private isCacheSending: boolean
  private topics: string[] = []
  private lastTopicFetch: number = 0
  private TOPIC_CACHE_VALIDITY = KafkaService.DEFAULT_TOPIC_CACHE_VALIDITY
  HTTP_ERROR = 'HttpErrorResponse'

  eventCallback = new Subject<any>(); // Source
  eventCallback$ = this.eventCallback.asObservable(); // Stream
  progress = 0
  cacheSize = 0

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
      if (typeof timeout === 'number') this.TOPIC_CACHE_VALIDITY = timeout
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
    return this.cache.storeInCache(type, kafkaObject, cacheValue)
  }

  sendAllFromCache(): Promise<any> {
    let successKeys: string[] = []
    let failedKeys: string[] = []
    if (this.isCacheSending) return Promise.resolve([])
    this.cache.setCacheSending(true)
    return Promise.all([
      this.cache.getCache(),
      this.cache.getCacheSize(),
      this.getKafkaHeaders(DefaultKafkaRequestContentType),
      this.schema.getKafkaObjectKey(),
    ])
      .then(([cache, size, headers, kafkaKey]) => {
        this.progress = 0
        this.cacheSize = size
        return Promise.all(Object.entries(cache)
          .filter(([k]) => k)
          .map((entry, i) => {
            const [k, v] = entry
            return this.convertEntryToRecord(kafkaKey, k, v)
              .then(r => {
                this.updateProgress()
                return this.sendToKafka(r.topic, r.record, headers)
              }).then(() => {
                successKeys.push(k)
                return this.cache.removeFromCache(k)
              }).catch(e => {
                failedKeys.push(k)
                return this.logger.error('Failed to send data from cache to kafka', e)
              }).finally(() => this.updateProgress())
          }))
      }).then(() => {
        this.setCacheSending(false)
        return ({ successKeys, failedKeys })
      })
  }

  convertEntryToRecord(kafkaKey, k, v) {
    const type = v.name
    return this.schema.getKafkaPayload(type, kafkaKey, v.kafkaObject.value, k, this.topics)
  }

  sendToKafka(topic, record, headers): Promise<any> {
    const allRecords = record.records
    const compressed = pako.gzip(JSON.stringify(record)).buffer
    return this.postData(
      compressed,
      topic,
      headers.set('Content-Encoding', DefaultCompressedContentEncoding)
    )
      .catch(e => {
        if (e.name == this.HTTP_ERROR) {
          this.logger.log('Retrying uncompressed..')
          return this.postData(record, topic, headers)
        }
        throw e
      })
      .then(() => this.sendEvent(allRecords[0], DataEventType.SEND_SUCCESS))
      .catch(e => {
        this.sendEvent(allRecords[0], DataEventType.SEND_ERROR, e)
        throw e
      })
  }

  updateProgress() {
    // Cache size is multiplied by 2 because we have to convert and send
    this.eventCallback.next(++this.progress / (this.cacheSize * 2))
  }

  sendEvent(record, eventType, error?) {
    if (record && record.value) {
      this.sendDataEvent(
        DataEventType.SEND_SUCCESS,
        eventType,
        record.value.name ? record.value.name : record.value.questionnaireName,
        record.time,
        error ? JSON.stringify(error) : ''
      )
    }
  }

  postData(data, topic, headers) {
    return this.http
      .post(this.KAFKA_CLIENT_URL + this.URI_topics + topic, data, {
        headers
      }).toPromise()
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

  setCacheSending(val: boolean) {
    this.isCacheSending = val
  }

  setLastUploadDate(date) {
    return this.storage.set(StorageKeys.LAST_UPLOAD_DATE, date)
  }

  setHealthkitPollTimes(dic) {
    return this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, dic)
  }

  getLastUploadDate() {
    return this.cache.getLastUploadDate()
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