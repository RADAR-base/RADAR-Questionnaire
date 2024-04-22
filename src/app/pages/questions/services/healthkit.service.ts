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
import { DefaultHealthkitLookbackInterval, DefaultHealthkitPermissions } from 'src/assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { ConfigKeys } from 'src/app/shared/enums/config'

declare var Media: any // stops errors w/ cordova-plugin-media-with-compression types

@Injectable({
  providedIn: 'root'
})
export class HealthkitService {
  READ_PERMISSIONS = DefaultHealthkitPermissions
  // The interval days for first query
  MIN_POLL_TIMESTAMP = new Date()

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
          String(DefaultHealthkitLookbackInterval)
        )
        .then(interval => {
          this.MIN_POLL_TIMESTAMP = new Date(
            new Date().getTime() - getMilliseconds({ days: Number(interval) }))
        })
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

  loadData(healthDataType) {
    return this.getLastPollTimes().then(dic => {
      let lastPollTime = this.MIN_POLL_TIMESTAMP
      // if (healthDataType in dic) lastPollTime = dic[healthDataType]
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

  async query(queryStartTime: Date, queryEndTime: Date, dataTypes: string[]) {
    try {
      let startTime = setDateTimeToMidnightEpoch(queryStartTime)
      let endTime = startTime + getMilliseconds({ days: 90 })
      let completeData = []
      while (endTime < queryEndTime.getTime()) {
        const queryOptions = {
          sampleNames: dataTypes,
          startDate: new Date(startTime).toISOString(),
          endDate: new Date(endTime).toISOString(),
          limit: 0 // This is to get all the data
        }
        await CapacitorHealthkit.multipleQueryHKitSampleType(queryOptions)
          .then(res => {
            return (completeData = completeData.concat(res))
          })
        startTime = endTime
        endTime = endTime + getMilliseconds({ days: 90 })
      }
      return this.combineHKSamples(completeData)
    } catch (e) {
      return []
    }
  }

  combineHKSamples(dataArray: any[]): any {
    return dataArray.reduce((acc: any, obj: any) => {
        for (const key in obj) {
            if (acc.hasOwnProperty(key)) {
                acc[key].resultData = acc[key].resultData.concat(obj[key].resultData);
                acc[key].countReturn += obj[key].countReturn;
            } else {
                acc[key] = { ...obj[key] };
            }
        }
        return acc;
    }, {});
}

  reset() {
    return this.setLastPollTimes({})
  }
}
