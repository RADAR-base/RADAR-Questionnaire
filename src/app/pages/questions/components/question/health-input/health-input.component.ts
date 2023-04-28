import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Health } from '@awesome-cordova-plugins/health/ngx'
import { StorageService } from 'src/app/core/services/storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import { Health_Requirement, Question } from 'src/app/shared/models/question'

import { Response } from '../../../../../shared/models/question'

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

  health_value: any
  health_display: any
  health_display_time: any
  health_time: any
  not_support = false
  // the interval days for first query
  defaultInterval = 1000

  // the bucket for aggregated query
  defaultBucket = 'day'
  MIN_POLL_TIMESTAMP = new Date(
    new Date().getTime() - this.defaultInterval * 24 * 60 * 60 * 1000
  )

  constructor(private health: Health, private storage: StorageService) {}

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
    this.health
      .isAvailable()
      .then((available: boolean) => {
        this.health
          .requestAuthorization([
            {
              read: requireField //read only permission
            }
          ])
          .then(res => {
            this.loadData(healthDataType).then(data => {
              this.onInputChange(data)
            })
          })
          .catch(e => console.log(e))
      })
      .catch(e => {
        this.not_support = true
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
}
