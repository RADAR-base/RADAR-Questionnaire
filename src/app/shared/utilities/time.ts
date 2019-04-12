import {
  DefaultScheduleYearCoverage,
  DefaultTimeInterval
} from '../../../assets/data/defaultConfig'
import { TimeInterval } from '../../shared/models/protocol'

export enum TimeConversion {
  SEC_TO_MILLISEC = 1000,
  HOUR_TO_MIN = 60,
  MIN_TO_SEC = 60,
  DAY_TO_HOUR = 24,
  YEAR_TO_DAY = 365,
  WEEK_TO_DAY = 7,
  MONTH_TO_DAY = 31
}

interface Time {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}

export function getMilliseconds(time: Time) {
  return getSeconds(time) * TimeConversion.SEC_TO_MILLISEC
}

export function getSeconds(time: Time) {
  let seconds = 0
  if (time.years)
    seconds +=
      time.years *
      TimeConversion.YEAR_TO_DAY *
      TimeConversion.DAY_TO_HOUR *
      TimeConversion.HOUR_TO_MIN *
      TimeConversion.MIN_TO_SEC
  if (time.months)
    seconds +=
      time.months *
      TimeConversion.MONTH_TO_DAY *
      TimeConversion.DAY_TO_HOUR *
      TimeConversion.HOUR_TO_MIN *
      TimeConversion.MIN_TO_SEC
  if (time.weeks)
    seconds +=
      time.weeks *
      TimeConversion.WEEK_TO_DAY *
      TimeConversion.DAY_TO_HOUR *
      TimeConversion.HOUR_TO_MIN *
      TimeConversion.MIN_TO_SEC
  if (time.days)
    seconds +=
      time.days *
      TimeConversion.DAY_TO_HOUR *
      TimeConversion.HOUR_TO_MIN *
      TimeConversion.MIN_TO_SEC
  if (time.hours)
    seconds +=
      time.hours * TimeConversion.HOUR_TO_MIN * TimeConversion.MIN_TO_SEC
  if (time.minutes) seconds += time.minutes * TimeConversion.MIN_TO_SEC
  if (time.seconds) seconds += time.seconds
  if (time.milliseconds)
    seconds += time.milliseconds / TimeConversion.SEC_TO_MILLISEC
  return seconds
}

export function formatTime(date) {
  const hour = date.getHours()
  const min = date.getMinutes()
  const hourStr = hour < 10 ? '0' + String(hour) : String(hour)
  const minStr = min < 10 ? '0' + String(min) : String(min)
  return hourStr + ':' + minStr
}

export function timeIntervalToMillis(interval: TimeInterval): number {
  if (!interval) {
    return getMilliseconds({ years: DefaultScheduleYearCoverage })
  }
  const unit =
    interval.unit in TIME_UNIT_MILLIS ? interval.unit : DefaultTimeInterval.unit
  const amount = interval.amount ? interval.amount : DefaultTimeInterval.amount
  return amount * TIME_UNIT_MILLIS[unit]
}

export const TIME_UNIT_MILLIS = {
  min: getMilliseconds({ minutes: 1 }),
  hour: getMilliseconds({ hours: 1 }),
  day: getMilliseconds({ days: 1 }),
  week: getMilliseconds({ weeks: 1 }),
  month: getMilliseconds({ months: 1 }),
  year: getMilliseconds({ years: 1 })
}
