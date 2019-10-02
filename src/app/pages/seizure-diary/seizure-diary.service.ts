import { Injectable } from '@angular/core'
import { Moment } from 'moment'
import * as moment from 'moment'

import { StorageKeys } from '../../shared/enums/storage'
import { StorageService } from '../../core/services/storage/storage.service'
import { LocalizationService } from '../../core/services/misc/localization.service'


@Injectable()
export class SeizureDiaryService {
  private readonly SD_STORE = {
    SD_RECENT_EVENTS: StorageKeys.SD_RECENT_EVENTS,
  }

  constructor(
    private storage: StorageService,
    private localization: LocalizationService,
  ) {}

  // gets events from storage, checks for 24h time constraint, and re-sets and returns events within the last 24h
  getEvents(): Promise<any> {
    return this.storage.get(this.SD_STORE.SD_RECENT_EVENTS).then((events) => {
      var recentFiltered = events !== null ? events.filter(this.eventWithin24h, this) : []
      var olderFiltered = events !== null ? events.filter(this.eventOlder24h, this) : []
      return [recentFiltered, olderFiltered]
    })
  }

  addEvent(task, answers): Promise<any> {
    return this.storage.push(this.SD_STORE.SD_RECENT_EVENTS, {
      task: task,
      data: answers
    })
  }

  clear() {
    return this.storage.remove(this.SD_STORE.SD_RECENT_EVENTS)
  }

  yesnoRadioToText(choice: number): String {
    switch (choice) {
      case 0: return 'No'
      case 1: return 'Yes'
      default: return 'Don\'t Know'
    }
  }

  triggerDetailToText(choice: number): String {
    switch (choice) {
      case 1: return 'lack of sleep'
      case 2: return 'stress event'
      case 3: return 'tiredness'
      case 4: return 'flashing light'
      case 5: return 'alcohol'
      case 6: return 'forgot to take medication'
      case 7: return 'other'
      default: return 'N/A'
    }
  }

  processEvent(event) {
    const e = event.data
    const d_start = JSON.parse(e.answers[0].value.string)
    if (isNaN(Number(d_start.month))) d_start.month = this.localization.moment().month(d_start.month).format("M")
    const d_start_parse = `${d_start.day}-${d_start.month}-${d_start.year} ${d_start.hour}:${d_start.minute} ${d_start.ampm}`
    const d_start_string = this.localization.moment(d_start_parse, "DD-MM-YYYY LT", false).format("lll")
    const d_duration = JSON.parse(e.answers[1].value.string)
    const d_duration_min = moment.duration({hours: d_duration.hour, minutes: d_duration.minute}).asMinutes()
    const d_duration_string = d_duration_min + (d_duration_min > 1 ? " minutes" : " minute")

    return {
      raw: event,
      time: e.time,
      timeCompleted: e.timeCompleted,
      diary_start: d_start,
      diary_start_string: d_start_string,
      diary_duration: d_duration,
      diary_duration_string: d_duration_string,
      diary_unconscious: this.yesnoRadioToText(JSON.parse(e.answers[2].value.string)),
      diary_awareness: this.yesnoRadioToText(JSON.parse(e.answers[3].value.string)),
      diary_motor: this.yesnoRadioToText(JSON.parse(e.answers[4].value.string)),
      diary_nonmotor: this.yesnoRadioToText(JSON.parse(e.answers[5].value.string)),
      diary_confirmation: this.yesnoRadioToText(JSON.parse(e.answers[6].value.string)),
      diary_wearable: this.yesnoRadioToText(JSON.parse(e.answers[7].value.string)),
      diary_trigger: this.yesnoRadioToText(JSON.parse(e.answers[8].value.string)),
      diary_trigger_detail: e.answers.length > 9 ? this.triggerDetailToText(JSON.parse(e.answers[9].value.string)) : 'N/A',
      diary_trigger_other: e.answers.length > 10 ? e.answers[10].value.string : 'N/A',
    }
  }
  processEvents(events) {
    let processedEvents = [];
    for (let event of events) processedEvents.push(this.processEvent(event))
    return processedEvents;
  }

  compareEvents(a,b) {
    const aDate = Date.parse(a.diary_start_string)
    const bDate = Date.parse(b.diary_start_string)
    if (aDate < bDate) {
      return -1;
    }
    if (aDate > bDate) {
      return 1;
    }
    return 0;
  }

  eventWithin24h(element) {
    const event_date = Date.parse(this.processEvent(element).diary_start_string)
    if (Date.now()-event_date < 86400000) {
      return true
    }
    return false
  }
  eventOlder24h(element) {
    return !this.eventWithin24h(element)
  }

}
