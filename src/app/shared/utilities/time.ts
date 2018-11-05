const SEC_MILLISEC = 1000
const HOUR_MIN = 60
const MIN_SEC = 60
const DAY_HOUR = 24
const YEAR_DAY = 365
const WEEK_DAY = 7
const MONTH_DAY = 31

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
  return getSeconds(time) * SEC_MILLISEC
}

export function getSeconds(time: Time) {
  let seconds = 0
  if (time.years)
    seconds += time.years * YEAR_DAY * DAY_HOUR * HOUR_MIN * MIN_SEC
  if (time.months)
    seconds += time.months * MONTH_DAY * DAY_HOUR * HOUR_MIN * MIN_SEC
  if (time.weeks)
    seconds += time.weeks * WEEK_DAY * DAY_HOUR * HOUR_MIN * MIN_SEC
  if (time.days) seconds += time.days * DAY_HOUR * HOUR_MIN * MIN_SEC
  if (time.hours) seconds += time.hours * HOUR_MIN * MIN_SEC
  if (time.minutes) seconds += time.minutes * MIN_SEC
  if (time.seconds) seconds += time.seconds
  if (time.milliseconds) seconds += time.milliseconds / SEC_MILLISEC
  return seconds
}
