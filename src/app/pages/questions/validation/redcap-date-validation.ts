import { RedcapDateKeyword, ValidationType } from '../../../shared/models/question'

export const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY'
const ISO_DATE = 'YYYY-MM-DD'

export interface RedcapDateValidationContext {
  validationType: string
  textValidationMin?: string
  textValidationMax?: string
}

export interface DatePickerBounds {
  fromDate?: Date
  toDate?: Date
}

export type DateAnswerParts = Record<string, string>
export type DateBoundRole = 'min' | 'max'

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

const PARSE_FORMATS: Partial<Record<ValidationType, string[]>> = {
  [ValidationType.DATE_DMY]: ['DD-MM-YYYY', 'D-M-YYYY', 'DD/MM/YYYY', 'D/M/YYYY'],
  [ValidationType.DATE_MDY]: ['MM-DD-YYYY', 'M-D-YYYY', 'MM/DD/YYYY', 'M/D/YYYY'],
  [ValidationType.DATE_YMD]: ['YYYY/M/D', 'YYYY/M/DD'],
  [ValidationType.DATETIME_DMY]: [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'DD-MM-YYYY HH:mm:ss',
    'DD-MM-YYYY'
  ],
  [ValidationType.DATETIME_MDY]: [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'MM-DD-YYYY HH:mm:ss',
    'MM-DD-YYYY'
  ],
  [ValidationType.DATETIME_YMD]: ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm']
}

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

export function getParseFormats(validationType: ValidationType): string[] {
  return [ISO_DATE, ...(PARSE_FORMATS[validationType] ?? [])]
}

export function parseRedcapDateKeyword(raw: string): RedcapDateKeyword | null {
  const token = raw.trim().toLowerCase()
  return Object.values(RedcapDateKeyword).includes(token as RedcapDateKeyword)
    ? (token as RedcapDateKeyword)
    : null
}
