import { Injectable } from '@angular/core'
import { Moment } from 'moment'

import { LocalizationService } from '../../../core/services/misc/localization.service'
import { RedcapDateKeyword, ValidationType } from '../../../shared/models/question'
import {
  DateAnswerParts,
  DateBoundRole,
  DatePickerBounds,
  DATE_DISPLAY_FORMAT,
  getParseFormats,
  isDateTimeValidationType,
  parseRedcapDateKeyword,
  RedcapDateValidationContext
} from '../validation/redcap-date-validation'

@Injectable({ providedIn: 'root' })
export class RedcapDateValidationService {
  readonly displayFormat = DATE_DISPLAY_FORMAT

  constructor(private localization: LocalizationService) {}

  parseDisplayDate(dateStr: string): Moment | null {
    const parsed = this.localization.moment(dateStr, this.displayFormat, true)
    return parsed.isValid() ? parsed : null
  }

  getPickerBounds(context: RedcapDateValidationContext): DatePickerBounds {
    const { min, max } = this.getBounds(context)
    return {
      ...(min && { fromDate: min.toDate() }),
      ...(max && { toDate: max.toDate() })
    }
  }

  applyPickerBounds(
    pickerConfig: Record<string, unknown>,
    context: RedcapDateValidationContext
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
    context: RedcapDateValidationContext,
    defaultTime?: DateAnswerParts
  ): Moment | null {
    if (!parts.year || !parts.month || !parts.day) return null

    const dateMoment = this.localization.moment(
      `${parts.year}-${parts.month}-${parts.day}`,
      ['YYYY-M-D', 'YYYY-MMM-D', 'YYYY-MM-DD', ...getParseFormats(context.validationType as ValidationType)],
      true
    )
    if (!dateMoment.isValid()) return null
    if (!isDateTimeValidationType(context.validationType)) {
      return dateMoment.startOf('day')
    }

    const time = this.localization.moment(
      `${parts.hour ?? defaultTime?.hour ?? '12'}:${parts.minute ?? defaultTime?.minute ?? '00'}:${parts.second ?? defaultTime?.second ?? '00'} ${parts.ampm ?? defaultTime?.ampm ?? 'AM'}`,
      'hh:mm:ss A',
      true
    )
    if (!time.isValid()) return dateMoment.startOf('day')

    return dateMoment.set({
      hour: time.hour(),
      minute: time.minute(),
      second: time.second()
    })
  }

  isAnswerValid(
    parts: DateAnswerParts,
    context: RedcapDateValidationContext,
    defaultTime?: DateAnswerParts
  ): boolean {
    const value = this.momentFromAnswerParts(parts, context, defaultTime)
    if (!value) return true
    return !this.isOutOfRange(value, context)
  }

  clampToBounds(m: Moment, context: RedcapDateValidationContext): Moment {
    const { min, max } = this.getBounds(context)
    let result = m.clone()
    if (min?.isAfter(result)) result = min.clone()
    if (max?.isBefore(result)) result = max.clone()
    return result
  }

  isOutOfRange(m: Moment, context: RedcapDateValidationContext): boolean {
    const { min, max } = this.getBounds(context)
    if (!min && !max) return false

    const value = isDateTimeValidationType(context.validationType)
      ? m.clone()
      : m.clone().startOf('day')

    return Boolean(
      (min && value.isBefore(min)) || (max && value.isAfter(max))
    )
  }

  private getBounds(context: RedcapDateValidationContext): {
    min: Moment | null
    max: Moment | null
  } {
    return {
      min: this.resolveBound(context, context.textValidationMin, 'min'),
      max: this.resolveBound(context, context.textValidationMax, 'max')
    }
  }

  private resolveBound(
    context: RedcapDateValidationContext,
    raw: string | undefined,
    role: DateBoundRole
  ): Moment | null {
    if (!raw?.trim()) return null

    const keyword = parseRedcapDateKeyword(raw)
    if (keyword) return this.boundFromKeyword(keyword, role)

    const parsed = this.parseFixedDate(context, raw.trim())
    if (!parsed) return null

    return this.alignBound(parsed, role, isDateTimeValidationType(context.validationType))
  }

  private boundFromKeyword(keyword: RedcapDateKeyword, role: DateBoundRole): Moment {
    const now = this.localization.moment()
    if (keyword === RedcapDateKeyword.NOW) return now.clone()
    return role === 'min' ? now.clone().startOf('day') : now.clone().endOf('day')
  }

  private parseFixedDate(
    context: RedcapDateValidationContext,
    raw: string
  ): Moment | null {
    for (const format of getParseFormats(context.validationType as ValidationType)) {
      const parsed = this.localization.moment(raw, format, true)
      if (parsed.isValid()) return parsed
    }
    const loose = this.localization.moment(raw)
    return loose.isValid() ? loose : null
  }

  private alignBound(
    parsed: Moment,
    role: DateBoundRole,
    isDatetime: boolean
  ): Moment {
    if (isDatetime) {
      return role === 'min' ? parsed.clone().startOf('second') : parsed.clone().endOf('second')
    }
    return role === 'min' ? parsed.clone().startOf('day') : parsed.clone().endOf('day')
  }
}
