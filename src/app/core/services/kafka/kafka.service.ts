import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { CapacitorHttp } from '@capacitor/core'

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
import { from, isObservable, Observable, of, Subject } from 'rxjs'
import { concatMap } from 'rxjs/operators'
import pLimit from 'p-limit'
import { NotificationService } from '../notifications/notification.service'
import { NotificationActionType } from 'src/app/shared/models/notification-handler'
import { Network } from '@capacitor/network'

interface PrepareKafkaOptions {
  sendEvent?: boolean
}

interface KafkaPayloadStreamOptions {
  stream?: boolean
  pageSize?: number
}

interface SendFromCacheOptions {
  streamHealthkitPayloads?: boolean
  healthkitPageSize?: number
}

@Injectable()
export class KafkaService {
  private static DEFAULT_TOPIC_CACHE_VALIDITY = 600_000 // 10 minutes
  private static BATCH_SIZE = 10
  private static CONCURRENCY_LIMIT = 5
  private static SEND_ERROR_NOTIFICATION_THRESHOLD = 10
  private static HTTP_TIMEOUT = 120_000 // 2 minutes

  URI_topics: string = '/topics/'
  DEFAULT_KAFKA_AVSC = 'questionnaire'

  private KAFKA_CLIENT_URL: string
  private isCacheSending: boolean
  private cancelSending: boolean = false // Add flag to cancel sending
  private topics: string[] = []
  private lastTopicFetch: number = 0
  private TOPIC_CACHE_VALIDITY = KafkaService.DEFAULT_TOPIC_CACHE_VALIDITY
  HTTP_ERROR = 'HttpErrorResponse'

  eventCallback = new Subject<any>() // Source
  eventCallback$ = this.eventCallback.asObservable() // Stream
  private progressSubject = new Subject<{ success: number, failed: number, cacheSize: number }>()
  progress = 0
  failed = 0
  cacheSize = 0

  resetProgress() {
    this.progress = 0
    this.failed = 0
    this.progressSubject.next({ success: 0, failed: 0, cacheSize: 0 })
  }

  constructor(
    private storage: StorageService,
    private cache: CacheService,
    private token: TokenService,
    private schema: SchemaService,
    private analytics: AnalyticsService,
    private logger: LogService,
    private http: HttpClient,
    private remoteConfig: RemoteConfigService,
    private notificationService: NotificationService
  ) {
    this.updateURI()
    this.readTopicCacheValidity()
    this.progressSubject.subscribe((progress) => {
      this.eventCallback.next(progress)
    })
  }

  init() {
    return Promise.all([
      this.updateTopicCacheValidity(),
      this.fetchTopics(),
      this.schema.init(),
    ])
  }

  initCache() {
    return this.cache.setCache({})
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

  private buildCacheValue(type, payload): CacheValue {
    const name = type == SchemaType.ASSESSMENT ? payload.metadata.name : type
    const value = this.schema.getKafkaObjectValue(type, payload)
    return {
      kafkaObject: { value },
      name,
      avsc: payload.metadata ? payload.metadata.avsc : this.DEFAULT_KAFKA_AVSC
    }
  }

  prepareKafkaObjectAndStore(type, payload, options: PrepareKafkaOptions = {}) {
    const cacheValue = this.buildCacheValue(type, payload)
    const value = cacheValue.kafkaObject.value
    if (options.sendEvent !== false) {
      this.sendDataEvent(
        DataEventType.PREPARED_OBJECT,
        cacheValue.name,
        value['name'],
        value['timestamp']
      )
    }
    return this.cache.storeInCache(type, value, cacheValue, options)
  }

  prepareKafkaObjectsAndStoreMultiple(type, payloads: any[], options: PrepareKafkaOptions = {}) {
    if (!payloads || !payloads.length) return Promise.resolve()

    const cacheValuesWithObjects = payloads.map(payload => {
      const cacheValue = this.buildCacheValue(type, payload)
      return {
        kafkaObject: cacheValue.kafkaObject.value,
        cacheValue
      }
    })

    const firstValue = cacheValuesWithObjects[0].cacheValue.kafkaObject.value
    if (options.sendEvent !== false) {
      this.analytics.logEvent(DataEventType.PREPARED_OBJECT_BATCH, {
        name: type,
        questionnaire_name: firstValue['name'] || '',
        questionnaire_timestamp: String(firstValue['timestamp'] || ''),
        batch_size: String(cacheValuesWithObjects.length)
      })
    }

    return this.cache.storeInCacheMultiple(type, cacheValuesWithObjects, options)
  }

  async sendAllFromCache(options: SendFromCacheOptions = {}): Promise<any> {
    if (this.isCacheSending) {
      return Promise.resolve([])
    }

    await Network.getStatus()
    // Small delay to let it update
    await new Promise(resolve => setTimeout(resolve, 500))

    this.logger.log('Starting cache send process')
    this.setCacheSending(true)
    this.cancelSending = false // Reset cancel flag
    const successKeys: string[] = []
    const failedKeys: string[] = []

    try {
      const [cache, size, headers, kafkaKey] = await Promise.all([
        this.cache.getCache(),
        this.cache.getCacheSize(),
        this.getKafkaHeaders(DefaultKafkaRequestContentType),
        this.schema.getKafkaObjectKey(),
      ])

      this.progress = 0
      this.failed = 0
      this.cacheSize = size

      // Process entries in smaller batches for iOS
      const entries = Object.entries(cache).filter(([k]) => k)
      const limit = pLimit(KafkaService.CONCURRENCY_LIMIT)

      for (let i = 0; i < entries.length; i += KafkaService.BATCH_SIZE) {
        if (this.cancelSending) {
          this.logger.log('Cache sending cancelled by user')
          break
        }

        const batch = entries.slice(i, i + KafkaService.BATCH_SIZE)
        this.logger.log(`Processing batch ${i / KafkaService.BATCH_SIZE + 1} of ${Math.ceil(entries.length / KafkaService.BATCH_SIZE)}`)

        const batchSuccessKeys: string[] = []
        const batchFailedKeys: string[] = []

        const batchPromises = batch.map(([k, v]) =>
          limit(async () => {
            if (this.cancelSending) {
              throw new Error('Cache sending cancelled')
            }

            try {
              const sentRecordCount = await this.sendCacheEntry(
                kafkaKey,
                k,
                v,
                headers,
                options
              )
              if (sentRecordCount === 0) this.logger.log('Kafka record is empty, skipping sending')
              batchSuccessKeys.push(k)
            } catch (e) {
              if (e.message === 'Cache sending cancelled') {
                throw e
              }
              batchFailedKeys.push(k)
              // this.logger.error('Failed to send data from cache to kafka', e)
            }
          })
        )

        try {
          await Promise.all(batchPromises)
        } catch (error) {
          if (error.message === 'Cache sending cancelled') {
            this.logger.log('Batch processing cancelled')
            break
          }
        }

        if (batchSuccessKeys.length > 0) {
          try {
            await this.cache.removeFromCacheMultiple(batchSuccessKeys, { sendEvent: false })
            successKeys.push(...batchSuccessKeys)
            this.logger.log(`Removed ${batchSuccessKeys.length} successfully sent items from cache`)
          } catch (error) {
            this.logger.error('Failed to remove items from cache:', error)
            successKeys.push(...batchSuccessKeys)
          }
        }

        failedKeys.push(...batchFailedKeys)

        if (!this.cancelSending) {
          this.progress += batchSuccessKeys.length
          this.failed += batchFailedKeys.length
          this.updateProgress(this.progress, this.failed, this.cacheSize)
        }
      }

      if (failedKeys.length > KafkaService.SEND_ERROR_NOTIFICATION_THRESHOLD) {
        await this.sendDataErrorNotification()
      }

      this.sendCacheSendSummary(successKeys.length, failedKeys.length, this.cancelSending)

      const result = {
        successKeys,
        failedKeys,
        cancelled: this.cancelSending
      }

      this.logger.log(`Cache send completed. Success: ${successKeys.length}, Failed: ${failedKeys.length}, Cancelled: ${this.cancelSending}`)
      return result
    } catch (error) {
      this.setCacheSending(false)
      this.cancelSending = false
      this.logger.error('Error in sendAllFromCache:', error)
      throw error
    } finally {
      this.setCacheSending(false)
      this.cancelSending = false
      this.logger.log('Cache send process finished, flags reset')
    }
  }

  convertEntryToRecord(kafkaKey, k, v, options: SendFromCacheOptions = {}) {
    const type = v.name
    const payloadOptions: KafkaPayloadStreamOptions = {
      stream: this.shouldStreamKafkaPayload(type, options),
      pageSize: options.healthkitPageSize
    }
    return this.schema.getKafkaPayload(
      type,
      kafkaKey,
      v.kafkaObject.value,
      k,
      this.topics,
      payloadOptions
    )
  }

  private async sendCacheEntry(
    kafkaKey,
    cacheKey,
    cacheValue,
    headers: HttpHeaders,
    options: SendFromCacheOptions = {}
  ): Promise<number> {
    const payloadOrStream = this.convertEntryToRecord(kafkaKey, cacheKey, cacheValue, options)
    if (isObservable(payloadOrStream)) {
      return this.sendStreamToKafka(payloadOrStream, headers)
    }
    const payload = await payloadOrStream
    return this.sendPayloadToKafka(payload, headers)
  }

  private sendStreamToKafka(payloadStream: Observable<any>, headers: HttpHeaders): Promise<number> {
    let sentRecordCount = 0

    return new Promise((resolve, reject) => {
      payloadStream
        .pipe(
          concatMap(payload => {
            if (this.cancelSending) {
              throw new Error('Cache sending cancelled')
            }
            if (!payload?.record?.records?.length) {
              return of(0)
            }
            return from(
              this.sendToKafka(payload.topic, payload.record, headers).then(
                () => payload.record.records.length
              )
            )
          })
        )
        .subscribe({
          next: sentCount => {
            sentRecordCount += sentCount
          },
          error: error => reject(error),
          complete: () => resolve(sentRecordCount)
        })
    })
  }

  private async sendPayloadToKafka(payload, headers: HttpHeaders): Promise<number> {
    if (!payload?.record?.records?.length) {
      return 0
    }
    await this.sendToKafka(payload.topic, payload.record, headers)
    return payload.record.records.length
  }

  private shouldStreamKafkaPayload(type: string, options: SendFromCacheOptions): boolean {
    if (!(typeof type === 'string' && type.toLowerCase().includes(SchemaType.HEALTHKIT))) {
      return false
    }
    return options.streamHealthkitPayloads !== false
  }

  sendToKafka(topic, record, headers): Promise<any> {
    return this.postData(JSON.stringify(record), topic, headers)
  }

  updateProgress(success, failed, cacheSize) {
    try {
      // const normalizedProgress = Math.min(Math.max(progress / cacheSize, 0), 1)
      setTimeout(() => {
        this.progressSubject.next({ success, failed, cacheSize })
      }, 0)
    } catch (error) {
      this.logger.error('Error updating progress:', error)
      setTimeout(() => {
        // this.progressSubject.next(Math.min(Math.max(progress / cacheSize, 0), 1))
      }, 0)
    }
  }

  sendDataErrorNotification() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.SEND_ERROR_NOTIFICATION,
          'false'
        )
      )
      .then(enabled => {
        if (enabled === 'true') {
          return this.notificationService.publish(NotificationActionType.SEND_ERROR)
        }
        return Promise.resolve()
      })
  }

  private convertHeaders(headers: HttpHeaders): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    headers.keys().forEach((key) => {
      const values = headers.getAll(key)
      if (values && values.length > 0) {
        result[key] = values.join(', ') // Join multiple values, if any
      }
    })
    return result
  }

  postData(data: any, topic: string, headers: HttpHeaders): Promise<any> {

    const nativeHeaders = this.convertHeaders(headers)

    const request = {
      url: `${this.KAFKA_CLIENT_URL}${this.URI_topics}${topic}`,
      data: data,
      headers: nativeHeaders,
      method: 'POST',
      readTimeout: KafkaService.HTTP_TIMEOUT,
      connectTimeout: KafkaService.HTTP_TIMEOUT,
    }

    const requestPromise = CapacitorHttp.request(request)
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new HttpErrorResponse({
            error: response.data,
            status: response.status,
          })
        }
        return response
      })
      .catch(error => {
        console.error('HTTP request failed:', error)

        if (this.cancelSending) {
          throw new Error('Request cancelled by user')
        }

        throw new Error(`Failed to send data to Kafka: ${error.message}`)
      })

    return requestPromise
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

  cancelCacheSending() {
    this.logger.log('Cancelling cache sending process')
    this.cancelSending = true
    this.isCacheSending = false
  }

  isCacheCurrentlySending(): boolean {
    return this.isCacheSending
  }

  setLastUploadDate(date) {
    return this.storage.set(StorageKeys.LAST_UPLOAD_DATE, date)
  }

  getLastUploadDate() {
    return this.cache.getLastUploadDate()
  }

  getCacheSize() {
    return this.cache.getCacheSize()
  }

  async countCacheEntriesWithPrefix(prefix: string): Promise<number> {
    try {
      const cache = await this.cache.getCache()
      if (!cache) return 0
      const prefixWithColon = `${prefix}:`
      return Object.keys(cache).reduce((count, key) => key && key.startsWith(prefixWithColon) ? count + 1 : count, 0)
    } catch (error) {
      this.logger.error('Error counting cache entries by prefix', error)
      return 0
    }
  }

  async hasCacheEntriesWithPrefix(prefix: string): Promise<boolean> {
    try {
      const cache = await this.cache.getCache()
      if (!cache) return false
      const prefixWithColon = `${prefix}:`
      return Object.keys(cache).some((key) => key && key.startsWith(prefixWithColon))
    } catch (error) {
      this.logger.error('Error checking cache entries by prefix', error)
      return false
    }
  }

  async deleteCacheEntriesWithPrefix(prefix: string): Promise<void> {
    try {
      const cache = await this.cache.getCache()
      if (!cache) return
      const prefixWithColon = `${prefix}:`
      const keysToDelete = Object.keys(cache).filter((key) => key && key.startsWith(prefixWithColon))
      await this.cache.removeFromCacheMultiple(keysToDelete)
    } catch (error) {
      this.logger.error('Error deleting cache entries by prefix', error)
    }
  }

  sendDataEvent(type, name, questionnaire, timestamp, error?) {
    if (!type) return
    this.analytics.logEvent(type, {
      name,
      questionnaire_name: questionnaire,
      questionnaire_timestamp: String(timestamp),
      error: JSON.stringify(error)
    })
  }

  private sendCacheSendSummary(successCount: number, failedCount: number, cancelled: boolean) {
    if (successCount === 0 && failedCount === 0) return

    this.analytics.logEvent(DataEventType.SEND_SUMMARY, {
      success_count: String(successCount),
      failed_count: String(failedCount),
      cancelled: String(cancelled)
    })

    if (successCount > 0) {
      this.analytics.logEvent(DataEventType.SEND_SUCCESS, {
        name: 'cache_batch',
        batch_size: String(successCount)
      })
    }

    if (failedCount > 0) {
      this.analytics.logEvent(DataEventType.SEND_ERROR, {
        name: 'cache_batch',
        batch_size: String(failedCount)
      })
    }
  }

  reset() {
    this.schema.reset()
    return this.cache.reset()
  }
}
