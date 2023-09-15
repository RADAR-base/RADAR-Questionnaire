import { Injectable } from '@angular/core'
import { Health } from '@awesome-cordova-plugins/health/ngx'
import { Platform } from '@ionic/angular'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import {
  getMilliseconds,
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch
} from 'src/app/shared/utilities/time'

import { LogService } from '../../../core/services/misc/log.service'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable({
  providedIn: 'root'
})
export class HealthkitService {
  health_value: any
  health_display: any
  health_display_time: any
  health_time: any

  notSupported = false
  // The interval days for first query
  DEFAULT_LOOKBACK_INTERVAL = 30
  MIN_POLL_TIMESTAMP = new Date(
    new Date().getTime() - this.DEFAULT_LOOKBACK_INTERVAL * 24 * 60 * 60 * 1000
  )
  MAX_HOURLY_RECORD_LIMIT = 500

  constructor(
    private platform: Platform,
    private logger: LogService,
    private health: Health,
    private storage: StorageService
  ) {
    this.initLastPollTimes()
  }

  initLastPollTimes() {
    return this.getLastPollTimes().then(dic => {
      if (!dic) {
        return this.setLastPollTimes({})
      }
    })
  }

  getLastPollTimes() {
    return this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
  }

  setLastPollTimes(value) {
    this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, value)
  }

  checkHealthkitSupported() {
    return this.health.isAvailable()
  }

  loadData(healthDataType) {
    return this.getLastPollTimes().then(dic => {
      let lastPollTime = this.MIN_POLL_TIMESTAMP
      if (healthDataType in dic) lastPollTime = dic[healthDataType]
      return this.health
        .requestAuthorization([
          {
            read: [healthDataType] //read only permission
          }
        ])
        .then(() => {
          const endDate = new Date()
          return this.query(lastPollTime, endDate, healthDataType).then(res => {
            if (res.length) {
              const lastDataDate = new Date(res[res.length - 1].endDate)
              dic[healthDataType] = lastDataDate
              this.setLastPollTimes(dic)
            }
            return res
          })
        })
        .catch(e => {
          console.log(e)
          return null
        })
    })
  }

  async query(queryStartTime: Date, queryEndTime: Date, dataType: string) {
    let startTime = setDateTimeToMidnightEpoch(queryStartTime)
    let endTime = startTime + getMilliseconds({ hours: 1 })
    let completeData = []
    while (endTime < queryEndTime.getTime()) {
      await this.health
        .query({
          startDate: new Date(startTime),
          endDate: new Date(endTime),
          dataType: dataType,
          limit: this.MAX_HOURLY_RECORD_LIMIT
        })
        .then(res => {
          return (completeData = completeData.concat(res))
        })
      startTime = endTime
      endTime = endTime + getMilliseconds({ hours: 1 })
    }
    return completeData
  }

  reset() {
    return this.setLastPollTimes({})
  }
}
