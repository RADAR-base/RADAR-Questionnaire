import { Moment } from 'moment'

import { DateValidationKeyword, ValidationType } from '../../../shared/models/question'

/** Shown in the calendar text field and modal picker. */
export const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY'

/** Fixed min/max from the questionnaire (typical export format). */
export const BOUND_DATE_FORMAT = 'YYYY-MM-DD'
export const BOUND_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

/** Parsed from wheel/answer parts (month is short name, e.g. Jan). */
export const ANSWER_DATE_FORMATS = ['YYYY-MMM-D', 'YYYY-MMM-DD']

export interface DateValidationContext {
  validationType: string
  textValidationMin?: string
  textValidationMax?: string
}

export interface DatePickerBounds {
  fromDate?: Date
  toDate?: Date
}

export type DateAnswerParts = Record<string, string>
type DateBoundRole = 'min' | 'max'

const DATE_ONLY_TYPES = new Set<ValidationType>([
  ValidationType.DATE_DMY,
  ValidationType.DATE_MDY,
  ValidationType.DATE_YMD
])

const DATETIME_TYPES = new Set<ValidationType>([
  ValidationType.DATETIME_DMY,
  ValidationType.DATETIME_MDY,
  ValidationType.DATETIME_YMD
])

export function isDateValidationType(validationType: string): boolean {
  const type = validationType as ValidationType
  return DATE_ONLY_TYPES.has(type) || DATETIME_TYPES.has(type)
}

export function isDateOnlyValidationType(validationType: string): boolean {
  return DATE_ONLY_TYPES.has(validationType as ValidationType)
}

export function isDateTimeValidationType(validationType: string): boolean {
  return DATETIME_TYPES.has(validationType as ValidationType)
}

export function parseDateValidationKeyword(
  raw: string
): DateValidationKeyword | null {
  const token = raw.trim().toLowerCase()
  return Object.values(DateValidationKeyword).includes(
    token as DateValidationKeyword
  )
    ? (token as DateValidationKeyword)
    : null
}

export function edgeOfBound(
  m: Moment,
  role: DateBoundRole,
  isDatetime: boolean
): Moment {
  if (isDatetime) {
    return role === 'min' ? m.clone().startOf('second') : m.clone().endOf('second')
  }
  return role === 'min' ? m.clone().startOf('day') : m.clone().endOf('day')
}
