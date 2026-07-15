import { Injectable } from '@angular/core'
import { Moment } from 'moment'

import { LocalizationService } from '../../../core/services/misc/localization.service'
import { DateValidationKeyword } from '../../../shared/models/question'
import {
  ANSWER_DATE_FORMATS,
  BOUND_DATE_FORMAT,
  BOUND_DATETIME_FORMAT,
  DateAnswerParts,
  DATE_DISPLAY_FORMAT,
  DatePickerBounds,
  DateValidationContext,
  edgeOfBound,
  isDateTimeValidationType,
  parseDateValidationKeyword
} from '../validation/date-validation'

@Injectable({ providedIn: 'root' })
export class DateValidationService {
  readonly displayFormat = DATE_DISPLAY_FORMAT

  constructor(private localization: LocalizationService) {}

  parseDisplayDate(dateStr: string): Moment | null {
    const parsed = this.localization.moment(dateStr, this.displayFormat, true)
    return parsed.isValid() ? parsed : null
  }

  getPickerBounds(context: DateValidationContext): DatePickerBounds {
    const min = this.resolveBound(context.textValidationMin, context, 'min')
    const max = this.resolveBound(context.textValidationMax, context, 'max')
    return {
      ...(min && { fromDate: min.toDate() }),
      ...(max && { toDate: max.toDate() })
    }
  }

  applyPickerBounds(
    pickerConfig: Record<string, unknown>,
    context: DateValidationContext
  ): void {
    const { fromDate, toDate } = this.getPickerBounds(context)
    if (fromDate) pickerConfig.fromDate = fromDate
    else delete pickerConfig.fromDate
    if (toDate) pickerConfig.toDate = toDate
    else delete pickerConfig.toDate
  }

  toAnswerDateParts(m: Moment): DateAnswerParts {
    return {
      day: m.format('DD'),
      month: m.format('MMM'),
      year: m.format('YYYY')
    }
  }

  momentFromAnswerParts(
    parts: DateAnswerParts,
    context: DateValidationContext,
    defaultTime?: DateAnswerParts
  ): Moment | null {
    if (!parts.year || !parts.month || !parts.day) return null

    const date = this.localization.moment(
      `${parts.year}-${parts.month}-${parts.day}`,
      ANSWER_DATE_FORMATS,
      true
    )
    if (!date.isValid()) return null
    if (!isDateTimeValidationType(context.validationType)) {
      return date.startOf('day')
    }

    const time = this.localization.moment(
      `${parts.hour ?? defaultTime?.hour ?? '12'}:${parts.minute ?? defaultTime?.minute ?? '00'}:${parts.second ?? defaultTime?.second ?? '00'} ${parts.ampm ?? defaultTime?.ampm ?? 'AM'}`,
      'hh:mm:ss A',
      true
    )
    if (!time.isValid()) return date.startOf('day')

    return date.set({
      hour: time.hour(),
      minute: time.minute(),
      second: time.second()
    })
  }

  isAnswerValid(
    parts: DateAnswerParts,
    context: DateValidationContext,
    defaultTime?: DateAnswerParts
  ): boolean {
    const value = this.momentFromAnswerParts(parts, context, defaultTime)
    return !value || !this.isOutOfRange(value, context)
  }

  clampToBounds(m: Moment, context: DateValidationContext): Moment {
    const min = this.resolveBound(context.textValidationMin, context, 'min')
    const max = this.resolveBound(context.textValidationMax, context, 'max')
    let result = m.clone()
    if (min?.isAfter(result)) result = min.clone()
    if (max?.isBefore(result)) result = max.clone()
    return result
  }

  isOutOfRange(m: Moment, context: DateValidationContext): boolean {
    const min = this.resolveBound(context.textValidationMin, context, 'min')
    const max = this.resolveBound(context.textValidationMax, context, 'max')
    if (!min && !max) return false

    const value = isDateTimeValidationType(context.validationType)
      ? m.clone()
      : m.clone().startOf('day')

    return Boolean(
      (min && value.isBefore(min)) || (max && value.isAfter(max))
    )
  }

  private resolveBound(
    raw: string | undefined,
    context: DateValidationContext,
    role: 'min' | 'max'
  ): Moment | null {
    if (!raw?.trim()) return null

    const keyword = parseDateValidationKeyword(raw)
    if (keyword) return this.boundFromKeyword(keyword, role)

    const parsed = this.parseBoundDate(raw.trim(), context)
    if (!parsed) return null

    return edgeOfBound(
      parsed,
      role,
      isDateTimeValidationType(context.validationType)
    )
  }

  private boundFromKeyword(
    keyword: DateValidationKeyword,
    role: 'min' | 'max'
  ): Moment {
    const now = this.localization.moment()
    if (keyword === DateValidationKeyword.NOW) return now.clone()
    return role === 'min' ? now.clone().startOf('day') : now.clone().endOf('day')
  }

  private parseBoundDate(raw: string, context: DateValidationContext): Moment | null {
    const formats = isDateTimeValidationType(context.validationType)
      ? [BOUND_DATETIME_FORMAT, BOUND_DATE_FORMAT]
      : [BOUND_DATE_FORMAT]

    for (const format of formats) {
      const parsed = this.localization.moment(raw, format, true)
      if (parsed.isValid()) return parsed
    }
    return null
  }
}
