import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import {
  ActivityData,
  CapacitorHealthkit,
  OtherData,
  QueryOutput,
  SampleNames,
  SleepData
} from '@perfood/capacitor-healthkit'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import { Health_Requirement, Question } from 'src/app/shared/models/question'

import { Response } from '../../../../../shared/models/question'
import { HealthkitService } from '../../../services/healthkit.service'

@Component({
  selector: 'health-input',
  templateUrl: 'health-input.component.html',
  styleUrls: ['health-input.component.scss']
})
export class HealthInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<object> = new EventEmitter<object>()

  @Input()
  responses: Response[]

  @Input()
  health_question: Question

  health_display: string
  health_display_time: string
  health_value: any
  health_time: any
  isSupported = false

  // the bucket for aggregated query
  defaultInterval = 7 // days
  defaultBucket = 'day'
  MIN_POLL_TIMESTAMP = new Date(
    new Date().getTime() - this.defaultInterval * 24 * 60 * 60 * 1000
  )
  READ_PERMISSIONS = [
    'calories',
    'stairs',
    'activity',
    'steps',
    'distance',
    'duration',
    'weight'
  ]

  constructor(private storage: StorageService) {}

  ngOnInit() {
    this.initLastPollTimes()
    let requireField = []
    if (
      this.health_question.field_name === 'blood_pressure_systolic' ||
      this.health_question.field_name === 'blood_pressure_diastolic'
    ) {
      requireField = ['blood_pressure']
    } else {
      requireField = [this.health_question.field_name]
    }
    const healthDataType = requireField[0]
    CapacitorHealthkit.isAvailable()
      .then(() => {
        CapacitorHealthkit.requestAuthorization({
          all: [''],
          read: requireField,
          write: ['']
        })
          .then(res => {
            this.loadData(healthDataType).then(data => {
              this.onInputChange(data)
            })
          })
          .catch(e => console.log(e))
      })
      .catch(e => {
        this.isSupported = false
      })
  }

  initLastPollTimes() {
    const dic = this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
    if (!dic) {
      this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, {})
    }
  }

  onInputChange(data) {
    const event = {
      value: this.health_value,
      time: this.health_time
    }
    this.valueChange.emit(data)
  }

  loadData(healthDataType) {
    const dic = this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
    const lastPollTime = new Date(dic[healthDataType])

    return CapacitorHealthkit.requestAuthorization({
      all: [''],
      read: [healthDataType],
      write: ['']
    })
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
    // !Will have to remove activity here, since each activity acutally contains more payload
    // !Set the acitiviy to be UNKNOWN for now to avoid schema confliction
    return CapacitorHealthkit.queryHKitSampleType<OtherData>({
      // put the lastDate in StartDate
      startDate: queryStartTime.toISOString(),
      endDate: queryEndTime.toISOString(), // now
      sampleName: dataType,
      limit: 1000
    }).then((data: QueryOutput<OtherData>) => {
      console.log('Field type: ' + dataType)
      const countReturn = data.countReturn
      const res = data.resultData
      if (countReturn === 0) {
        this.health_value = null
        this.health_display = 'No data for today'
        this.health_display_time = new Date().toLocaleDateString()
        this.health_time = Math.floor(
          new Date(res[0].startDate).getTime() / 1000
        )
      } else {
        if (dataType === 'date_of_birth') {
          const value = res[0].value as any
          this.health_value = value.day + '/' + value.month + '/' + value.year
          this.health_display = this.health_value
        } else {
          this.health_value = res[0].value
          this.health_display =
            this.health_value.toFixed(2) + ' ' + res[0].unitName
        }
        // deal with time
        this.health_display_time = res[0].startDate
        this.health_time = Math.floor(
          new Date(res[0].startDate).getTime() / 1000
        )
      }
      return res
    })
  }
}
