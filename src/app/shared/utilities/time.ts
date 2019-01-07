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
  return getSeconds(time) * TimeConversion['SEC_TO_MILLISEC']
}

export function getSeconds(time: Time) {
  let seconds = 0
  if (time.years)
    seconds +=
      time.years *
      TimeConversion['YEAR_TO_DAY'] *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.months)
    seconds +=
      time.months *
      TimeConversion['MONTH_TO_DAY'] *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.weeks)
    seconds +=
      time.weeks *
      TimeConversion['WEEK_TO_DAY'] *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.days)
    seconds +=
      time.days *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.hours)
    seconds +=
      time.hours * TimeConversion['HOUR_TO_MIN'] * TimeConversion['MIN_TO_SEC']
  if (time.minutes) seconds += time.minutes * TimeConversion['MIN_TO_SEC']
  if (time.seconds) seconds += time.seconds
  if (time.milliseconds)
    seconds += time.milliseconds / TimeConversion['SEC_TO_MILLISEC']
  return seconds
}
