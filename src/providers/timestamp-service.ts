import { Injectable } from '@angular/core'
import { DatePipe } from '@angular/common'

import { Timestamp } from '../models/timestamp'

@Injectable()
export class TimeStampService {

  private date: Date

  // Change formats accordingly
  private TIME_FORMAT: string = "HH:mm:ss"
  private DATE_FORMAT: string = "dd-MM-yyyy"

  timestamps = {}

  constructor(
    private datepipe: DatePipe
  ) {
  }

  getTimeStamp() {
    // timestamp used to record response time of questionnaires
    this.date = new Date()
    return this.date.getTime()
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
    return new Date(this.date.getUTCFullYear(), this.date.getUTCMonth(),
      this.date.getUTCDate(), this.date.getUTCHours(), this.date.getUTCMinutes(), this.date.getUTCSeconds())
  }

  reset() {
    this.timestamps = {}
  }
}
