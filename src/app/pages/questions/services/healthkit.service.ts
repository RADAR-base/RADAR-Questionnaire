import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import {
  getMilliseconds,
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch
} from 'src/app/shared/utilities/time'
import {
  ActivityData,
  CapacitorHealthkit,
  OtherData,
  QueryOutput,
  SampleNames,
  SleepData
} from '@perfood/capacitor-healthkit'
import { LogService } from '../../../core/services/misc/log.service'
import { DefaultHealthkitPermissions } from 'src/assets/data/defaultConfig'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable({
  providedIn: 'root'
})
export class HealthkitService {
  READ_PERMISSIONS = DefaultHealthkitPermissions
  // The interval days for first query
  DEFAULT_LOOKBACK_INTERVAL = 30
  MIN_POLL_TIMESTAMP = new Date(
    new Date().getTime() - this.DEFAULT_LOOKBACK_INTERVAL * 24 * 60 * 60 * 1000
  )
  MAX_HOURLY_RECORD_LIMIT = 1000

  constructor(
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
    return CapacitorHealthkit.isAvailable()
  }

  loadData(healthDataType) {
    return this.getLastPollTimes().then(dic => {
      let lastPollTime = this.MIN_POLL_TIMESTAMP
      if (healthDataType in dic) lastPollTime = dic[healthDataType]
      return CapacitorHealthkit
        .requestAuthorization(
          {
            all: [''],
            read: this.READ_PERMISSIONS,
            write: [''],
          }
        )
        .then(() => {
          const currentDate = new Date()
          return { startTime: lastPollTime, endTime: currentDate }
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
      const queryOptions = {
        sampleName: dataType as SampleNames,
        startDate: new Date(startTime).toISOString(),
        endDate: new Date(endTime).toISOString(),
        limit: this.MAX_HOURLY_RECORD_LIMIT,
      };
      await CapacitorHealthkit.queryHKitSampleType(queryOptions)
        .then(res => {
          const data = res.resultData
          return (completeData = completeData.concat(data))
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
