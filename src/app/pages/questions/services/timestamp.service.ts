import { DatePipe } from '@angular/common'
import { Injectable } from '@angular/core'

import { Timestamp } from '../../../shared/models/timestamp'

@Injectable()
export class TimestampService {
  private date: Date

  // NOTE: Change formats accordingly
  private TIME_FORMAT: string = 'HH:mm:ss'
  private DATE_FORMAT: string = 'dd-MM-yyyy'

  timestamps = {}

  constructor(private datepipe: DatePipe) {}

  getTimeStamp() {
    // NOTE: Timestamp used to record response time of questionnaires
    return Date.now()
  }

  getCurrentTime() {
    return this.datepipe.transform(this.getUTC(), this.TIME_FORMAT)
  }

  getCurrentDate() {
    return this.datepipe.transform(this.getUTC(), this.DATE_FORMAT)
  }

  add(value: Timestamp) {
    this.timestamps[value.id] = value.value
  }

  getUTC() {
    return new Date(
      this.date.getUTCFullYear(),
      this.date.getUTCMonth(),
      this.date.getUTCDate(),
      this.date.getUTCHours(),
      this.date.getUTCMinutes(),
      this.date.getUTCSeconds()
    )
  }

  reset() {
    this.timestamps = {}
  }
}
