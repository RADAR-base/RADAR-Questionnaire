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
import { DefaultHealthkitInterval, DefaultHealthkitPermissions } from 'src/assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { ConfigKeys } from 'src/app/shared/enums/config'


@Injectable({
  providedIn: 'root'
})
export class HealthkitService {
  READ_PERMISSIONS = DefaultHealthkitPermissions
  // The interval days for first query
  HEALTHKIT_INTERVAL_DAYS = String(DefaultHealthkitInterval)
  queryProgress = 0

  constructor(
    private storage: StorageService,
    private remoteConfig: RemoteConfigService
  ) {
    this.init()
  }

  init() {
    this.remoteConfig.read().then(config => {
      config
        .getOrDefault(
          ConfigKeys.HEALTHKIT_LOOKBACK_INTERVAL_DAYS,
          String(DefaultHealthkitInterval)
        )
        .then(interval =>
          (this.HEALTHKIT_INTERVAL_DAYS = interval)
        )
    })
    return this.getLastPollTimes().then(dic => {
      if (!dic) return this.setLastPollTimes({})
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

  loadData(healthDataType, startTime) {
      return CapacitorHealthkit
        .requestAuthorization(
          {
            all: [''],
            read: this.READ_PERMISSIONS,
            write: [''],
          }
        )
        .then(() => {
          const endTime = new Date(
            startTime.getTime() + getMilliseconds({ days: Number(this.HEALTHKIT_INTERVAL_DAYS) }))
           return { startTime: startTime, endTime: endTime }
        })
        .catch(e => {
          console.log(e)
          return null
        })
  }

  async query(queryStartTime: Date, queryEndTime: Date, dataType: string) {
    try {
      let startTime = setDateTimeToMidnightEpoch(queryStartTime)
      let endTime = setDateTimeToMidnight(queryEndTime)
      const queryOptions = {
        sampleName: dataType,
        startDate: new Date(startTime).toISOString(),
        endDate: new Date(endTime).toISOString(),
        limit: 0 // This is to get all the data
      }
      return (await CapacitorHealthkit.queryHKitSampleType(queryOptions)).resultData
    } catch (e) {
      return []
    }
  }

  reset() {
    return Promise.resolve()
  }
}
