import { Injectable } from '@angular/core'
import { Health } from '@awesome-cordova-plugins/health/ngx'
import { Platform } from '@ionic/angular'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'

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
  // the interval days for first query
  defaultInterval = 90

  // the bucket for aggregated query
  defaultBucket = 'day'
  MIN_POLL_TIMESTAMP = new Date(
    new Date().getTime() - this.defaultInterval * 24 * 60 * 60 * 1000
  )

  constructor(
    private platform: Platform,
    private logger: LogService,
    private health: Health,
    private storage: StorageService
  ) {
    this.initLastPollTimes()
  }

  initLastPollTimes() {
    const dic = this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
    if (!dic) {
      this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, {})
    }
  }

  checkHealthkitSupported() {
    return this.health.isAvailable()
  }

  loadData(healthDataType) {
    const dic = this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
    const lastPollTime = new Date(dic[healthDataType])

    return this.health
      .requestAuthorization([
        {
          read: [healthDataType] //read only permission
        }
      ])
      .then(() => {
        return this.query(
          lastPollTime ? lastPollTime : this.MIN_POLL_TIMESTAMP,
          new Date(),
          healthDataType
        ).then(res => {
          dic[healthDataType] = new Date().toLocaleDateString()
          this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, dic)
          return res
        })
      })
      .catch(e => {
        console.log(e)
        return null
      })
  }

  query(queryStartTime: Date, queryEndTime: Date, dataType: string) {
    queryStartTime = this.MIN_POLL_TIMESTAMP
    // !Will have to remove activity here, since each activity acutally contains more payload
    // !Set the acitiviy to be UNKNOWN for now to avoid schema confliction
    return this.health
      .query({
        // put the lastDate in StartDate
        startDate: queryStartTime,
        endDate: queryEndTime, // now
        dataType: dataType,
        limit: 1000
      })
      .then(res => {
        console.log('Field type: ' + dataType)
        console.log(res)
        if (res.length === 0) {
          this.health_value = null
          this.health_display = 'No data for today'
          this.health_display_time = new Date().toLocaleDateString()
          this.health_time = Math.floor(res[0].startDate.getTime() / 1000)
        } else {
          if (dataType === 'date_of_birth') {
            const value = res[0].value as any
            this.health_value = value.day + '/' + value.month + '/' + value.year
            this.health_display = this.health_value
          } else {
            this.health_value = parseFloat(res[0].value)
            this.health_display =
              this.health_value.toFixed(2) + ' ' + res[0].unit
          }
          // deal with time
          this.health_display_time = res[0].startDate.toLocaleDateString()
          this.health_time = Math.floor(res[0].startDate.getTime() / 1000)
        }
        return res
      })
  }

  processData(answers, timestamps, questions) {
    // this.logger.log('Answers to process', answers)

    let results = []
    for (const [key, value] of Object.entries<any>(answers)) {
      if (value !== null && value.length) {
        value.forEach(v => {
          let result = {}
          result = {
            startTime: v.startTime,
            endTime: v.endTime,
            timeReceived: timestamps[questions[0].field_name].startTime,
            [key]: v.value
          }
          results.push(result)
        })
      }
      console.log(results)
    }

    return results
  }
}
