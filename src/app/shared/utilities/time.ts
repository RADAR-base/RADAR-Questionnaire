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
  year?: number
  month?: number
  week?: number
  day?: number
  hour?: number
  min?: number
  sec?: number
  msec?: number
}

export function getMilliseconds(time: Time) {
  return getSeconds(time) * TimeConversion['SEC_TO_MILLISEC']
}

export function getSeconds(time: Time) {
  let seconds = 0
  if (time.year)
    seconds +=
      time.year *
      TimeConversion['YEAR_TO_DAY'] *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.month)
    seconds +=
      time.month *
      TimeConversion['MONTH_TO_DAY'] *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.week)
    seconds +=
      time.week *
      TimeConversion['WEEK_TO_DAY'] *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.day)
    seconds +=
      time.day *
      TimeConversion['DAY_TO_HOUR'] *
      TimeConversion['HOUR_TO_MIN'] *
      TimeConversion['MIN_TO_SEC']
  if (time.hour)
    seconds +=
      time.hour * TimeConversion['HOUR_TO_MIN'] * TimeConversion['MIN_TO_SEC']
  if (time.min) seconds += time.min * TimeConversion['MIN_TO_SEC']
  if (time.sec) seconds += time.sec
  if (time.msec) seconds += time.msec / TimeConversion['SEC_TO_MILLISEC']
  return seconds
}
