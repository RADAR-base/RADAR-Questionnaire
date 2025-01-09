import { Injectable } from '@angular/core'
import * as crypto from 'crypto-browserify'

import { DataEventType } from '../../../shared/enums/events'
import { StorageKeys } from '../../../shared/enums/storage'
import { CacheValue } from '../../../shared/models/cache'
import { SchemaType } from '../../../shared/models/kafka'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { AnalyticsService } from '../usage/analytics.service'

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

  storeInCache(type, kafkaObject, cacheValue: any) {
    return this.getCache().then(cache => {
      this.logger.log('KAFKA-SERVICE: Caching answers.')
      const key = this.generateCacheKey(type, kafkaObject)
      cache[key] = cacheValue
      this.sendDataEvent(DataEventType.CACHED, cacheValue)
      return this.setCache(cache)
    })
  }

  removeFromCache(cacheKey: string) {
    return this.getCache().then(cache => {
      if (cache) {
        if (cache[cacheKey]) {
          this.sendDataEvent(
            DataEventType.REMOVED_FROM_CACHE,
            cache[cacheKey]
          )
          this.logger.log('Deleting ' + cacheKey)
          delete cache[cacheKey]
        }
        this.setLastUploadDate(Date.now())
        return this.setCache(cache)
      }
    })
  }


  removeFromCacheMultiple(cacheKeys: string[]) {
    if (!cacheKeys.length) return Promise.resolve()
    return this.getCache().then(cache => {
      if (cache) {
        cacheKeys.map(cacheKey => {
          if (cache[cacheKey]) {
            this.sendDataEvent(
              DataEventType.REMOVED_FROM_CACHE,
              cache[cacheKey]
            )
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
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
    return `${prefix}:${hash}`
  }

  reset() {
    return Promise.all([this.setCache({}), this.setLastUploadDate(null)])
  }
}
