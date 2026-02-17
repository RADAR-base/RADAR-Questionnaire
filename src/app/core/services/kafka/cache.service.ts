import { Injectable } from '@angular/core'
import { md5 } from 'js-md5'

import { DataEventType } from '../../../shared/enums/events'
import { StorageKeys } from '../../../shared/enums/storage'
import { CacheValue } from '../../../shared/models/cache'
import { SchemaType } from '../../../shared/models/kafka'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { AnalyticsService } from '../usage/analytics.service'

interface CacheEventOptions {
  sendEvent?: boolean
}

@Injectable()
export class CacheService {
  URI_topics: string = '/topics/'

  private readonly KAFKA_STORE = {
    LAST_UPLOAD_DATE: StorageKeys.LAST_UPLOAD_DATE,
    CACHE_ANSWERS: StorageKeys.CACHE_ANSWERS
  }

  constructor(
    private storage: StorageService,
    private analytics: AnalyticsService,
    private logger: LogService
  ) { }

  init() {
    return Promise.all([this.setCache({})])
  }

  storeInCache(type, kafkaObject, cacheValue: any, options: CacheEventOptions = {}) {
    return this.getCache().then(cache => {
      this.logger.log('KAFKA-SERVICE: Caching answers.')
      const key = this.generateCacheKey(type, kafkaObject)
      cache[key] = cacheValue
      if (options.sendEvent !== false) {
        this.sendDataEvent(DataEventType.CACHED, cacheValue)
      }
      return this.setCache(cache)
    })
  }

  storeInCacheMultiple(type, kafkaObjectsAndValues: { kafkaObject: any, cacheValue: CacheValue }[], options: CacheEventOptions = {}) {
    if (!kafkaObjectsAndValues.length) return Promise.resolve()
    return this.getCache().then(cache => {
      this.logger.log(`KAFKA-SERVICE: Caching ${kafkaObjectsAndValues.length} answers in batch.`)
      kafkaObjectsAndValues.forEach(({ kafkaObject, cacheValue }) => {
        const key = this.generateCacheKey(type, kafkaObject)
        cache[key] = cacheValue
      })
      if (options.sendEvent !== false) {
        const firstCacheValue = kafkaObjectsAndValues[0].cacheValue
        this.analytics.logEvent(DataEventType.CACHED_BATCH, {
          name: firstCacheValue.repository ? SchemaType.ASSESSMENT : firstCacheValue.name,
          batch_size: String(kafkaObjectsAndValues.length)
        })
      }
      return this.setCache(cache)
    })
  }

  removeFromCache(cacheKey: string, options: CacheEventOptions = {}) {
    return this.getCache().then(cache => {
      if (cache) {
        if (cache[cacheKey]) {
          if (options.sendEvent !== false) {
            this.sendDataEvent(
              DataEventType.REMOVED_FROM_CACHE,
              cache[cacheKey]
            )
          }
          this.logger.log('Deleting ' + cacheKey)
          delete cache[cacheKey]
        }
        this.setLastUploadDate(Date.now())
        return this.setCache(cache)
      }
    })
  }


  removeFromCacheMultiple(cacheKeys: string[], options: CacheEventOptions = {}) {
    if (!cacheKeys.length) return Promise.resolve()
    return this.getCache().then(cache => {
      if (cache) {
        cacheKeys.map(cacheKey => {
          if (cache[cacheKey]) {
            if (options.sendEvent !== false) {
              this.sendDataEvent(
                DataEventType.REMOVED_FROM_CACHE,
                cache[cacheKey]
              )
            }
            this.logger.log('Deleting ' + cacheKey)
            delete cache[cacheKey]
          }
        })
        this.setLastUploadDate(Date.now())
        return this.setCache(cache)
      }
    })
  }

  setCache(cache) {
    return this.storage.set(this.KAFKA_STORE.CACHE_ANSWERS, cache)
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

  generateCacheKey(prefix: string, data: any): string {
    const hash = md5(JSON.stringify(data))
    return `${prefix.toLowerCase()}:${hash}`
  }

  reset() {
    return Promise.all([this.setCache({}), this.setLastUploadDate(null)])
  }
}
