import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Ionic4DatepickerModalComponent } from '@logisticinfotech/ionic4-datepicker'
import * as moment from 'moment'

import { LocalizationService } from '../../../../../core/services/misc/localization.service'
import { KeyboardEventType } from '../../../../../shared/enums/events'
import { InputModeType, ValidationType } from '../../../../../shared/models/question'
import { RedcapDateValidationService } from '../../../services/redcap-date-validation.service'
import {
  isDateOnlyValidationType,
  isDateTimeValidationType,
  isDateValidationType
} from '../../../validation/redcap-date-validation'

@Component({
  selector: 'text-input',
  templateUrl: 'text-input.component.html',
  styleUrls: ['text-input.component.scss']
})
export class TextInputComponent implements OnInit {
  @ViewChild('content', { static: false }) content

  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()
  @Output()
  keyboardEvent: EventEmitter<string> = new EventEmitter<string>()
  @Output()
  showWarningChange: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Input()
  currentlyShown: boolean
  @Input()
  validationType = ''
  @Input()
  textValidationMin: string
  @Input()
  textValidationMax: string

  /**
   * Controls whether Enter key submission is allowed.
   * Set to true when all required questions are answered and current answer is valid.
   * When false, pressing Enter will show a warning instead of proceeding to the next question.
   */
  @Input()
  canSubmitOnEnter = false

  ValidationType = ValidationType
  InputModeType = InputModeType

  showDatePicker: boolean
  showDateTimePicker = false
  showTimePicker: boolean
  showDurationPicker: boolean
  showWarningField = false
  useNumberInputWarning = false
  useDateInputWarning = false
  showTextInput = true
  showSeconds: boolean

  datePickerValues: { [key: string]: string[] }
  defaultDatePickerValue: { [key: string]: string }
  timePickerValues: { [key: string]: string[] }
  defaultTimePickerValue: { [key: string]: string }
  durationPickerValues: { [key: string]: string[] }
  defaultDurationPickerValue: { [key: string]: string }
  labels = {
    day: 'Day',
    month: 'Month',
    year: 'Year',
    hour: 'Hour',
    minute: 'Minute',
    second: 'Second',
    ampm: 'AM/PM'
  }
  textValue = ''
  value = {}
  inputModeType = 'text'
  inputType = 'text'
  inputStep = 'any'
  isNumericType = false
  isIntegerType = false
  // Regex pattern to validate numeric input (only digits allowed)
  DIGIT_PATTERN = /^\d*$/
  // Partial<Record<...>> allows only a subset of ValidationType keys without TypeScript complaining about missing entries
  INPUT_MODE_MAP: Partial<Record<ValidationType, InputModeType>> = {
    [ValidationType.NUMBER]: InputModeType.NUMBER,
    [ValidationType.INTEGER]: InputModeType.NUMBER,
    [ValidationType.EMAIL]: InputModeType.EMAIL,
    [ValidationType.PHONE]: InputModeType.PHONE
  }

  constructor(
    private localization: LocalizationService,
    private redcapDateValidation: RedcapDateValidationService,
    public modalCtrl: ModalController
  ) { }

  private get dateValidationContext() {
    return {
      validationType: this.validationType,
      textValidationMin: this.textValidationMin,
      textValidationMax: this.textValidationMax
    }
  }

  ngOnInit() {
    if (this.validationType.length) {
      this.inputModeType =
        this.INPUT_MODE_MAP[this.validationType as ValidationType] ||
        InputModeType.TEXT

      this.showDatePicker = isDateOnlyValidationType(this.validationType)
      this.showDateTimePicker = isDateTimeValidationType(this.validationType)
      this.showTimePicker = this.validationType === ValidationType.TIME
      this.showDurationPicker = this.validationType.includes(
        ValidationType.DURATION
      )
    }
    this.showTextInput =
      !this.showDatePicker &&
      !this.showDateTimePicker &&
      !this.showTimePicker &&
      !this.showDurationPicker
    this.showSeconds = this.validationType.includes(ValidationType.SECOND)
    this.isNumericType = this.isNumericValidationType()
    this.isIntegerType = this.validationType === ValidationType.INTEGER
    this.inputStep = this.isIntegerType ? '1' : 'any'
    this.selectedDate = this.localization
      .moment(Date.now())
      .format(this.redcapDateValidation.displayFormat)
    this.initValues()
  }

  initValues() {
    if (this.showTimePicker || this.showDateTimePicker) this.initTime()
    if (this.showDatePicker || this.showDateTimePicker) this.initDates()
    if (this.showDurationPicker) this.initDuration()
  }

  initDates() {
    const momentInstance = this.redcapDateValidation.clampToBounds(
      this.localization.moment(Date.now()),
      this.dateValidationContext
    )
    this.buildDatePickerObj()
    const month = moment.monthsShort()
    const day = this.addLeadingZero(Array.from(Array(32).keys()).slice(1, 32))
    const year = Array.from(Array(31).keys()).map(d => String(d + 2000))
    this.datePickerValues = { day, month, year }
    this.defaultDatePickerValue =
      this.redcapDateValidation.toAnswerDateParts(momentInstance)
    this.selectedDate = momentInstance.format(this.redcapDateValidation.displayFormat)
    this.emitDateAnswer(this.defaultDatePickerValue)
  }

  initTime() {
    const momentInstance = this.localization.moment(Date.now())
    const hour = this.addLeadingZero(Array.from(Array(13).keys()).slice(1, 13))
    const minute = this.addLeadingZero(Array.from(Array(60).keys()))
    const second = minute
    const ampm = ['AM', 'PM']
    this.timePickerValues = { hour, minute, ampm }
    if (this.showSeconds) this.timePickerValues = { hour, minute, second, ampm }
    this.defaultTimePickerValue = {
      hour: momentInstance.format('hh'),
      minute: momentInstance.format('mm'),
      second: this.showSeconds ? momentInstance.format('ss') : '00',
      ampm: momentInstance.format('A')
    }
  }

  initDuration() {
    const minute = this.addLeadingZero(Array.from(Array(60).keys()))
    const hour = this.addLeadingZero(Array.from(Array(24).keys()))
    this.durationPickerValues = { hour, minute }
    this.defaultDurationPickerValue = { hour: '00', minute: '00' }
  }

  addLeadingZero(values) {
    return values.map(d => (d < 10 ? '0' + d : d)).map(String)
  }

  datePickerObj: any = {}
  selectedDate: string

  async openDatePicker() {
    this.redcapDateValidation.applyPickerBounds(
      this.datePickerObj,
      this.dateValidationContext
    )
    const datePickerModal = await this.modalCtrl.create({
      component: Ionic4DatepickerModalComponent,
      cssClass: 'li-ionic4-datePicker',
      componentProps: {
        objConfig: this.datePickerObj,
        selectedDate: this.selectedDate
      }
    })
    await datePickerModal.present()

    datePickerModal.onDidDismiss().then(data => {
      if (!data?.data?.date) return

      const date = this.redcapDateValidation.parseDisplayDate(data.data.date)
      if (!date) return

      if (this.redcapDateValidation.isOutOfRange(date, this.dateValidationContext)) {
        this.setDateWarning(true)
        return
      }

      this.setDateWarning(false)
      this.selectedDate = date.format(this.redcapDateValidation.displayFormat)
      this.defaultDatePickerValue =
        this.redcapDateValidation.toAnswerDateParts(date)
      this.emitDateAnswer(this.defaultDatePickerValue)
    })
  }

  emitAnswer(value) {
    if (!value) value = this.textValue
    if (typeof value !== 'string') {
      if (isDateValidationType(this.validationType)) {
        this.emitDateAnswer(value as Record<string, string>)
        return
      }
      this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else {
      this.inputValidation(value)
      this.valueChange.emit(value)
    }
  }

  private emitDateAnswer(parts: Record<string, string>) {
    this.value = { ...this.value, ...parts }
    if (
      !this.redcapDateValidation.isAnswerValid(
        this.value as Record<string, string>,
        this.dateValidationContext,
        this.defaultTimePickerValue
      )
    ) {
      this.setDateWarning(true)
      return
    }
    this.setDateWarning(false)
    this.valueChange.emit(JSON.stringify(this.value))
  }

  inputValidation(value: string) {
    if (this.isNumericValidationType()) {
      const invalid = this.isInvalidNumericValue(value)
      this.showWarningField = invalid
      this.useNumberInputWarning = invalid
    } else {
      this.showWarningField = false
      this.useNumberInputWarning = false
    }
    this.showWarningChange.emit(this.showWarningField)
  }

  private isNumericValidationType(): boolean {
    return (
      this.validationType === ValidationType.NUMBER ||
      this.validationType === ValidationType.INTEGER
    )
  }

  private isInvalidNumericValue(value: string): boolean {
    if (!this.DIGIT_PATTERN.test(value)) return true
    return this.isOutOfRange(value)
  }

  private isOutOfRange(value: string): boolean {
    if (value === '') return false
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) return false
    const minValue = this.getBoundValue(this.textValidationMin)
    const maxValue = this.getBoundValue(this.textValidationMax)
    if (minValue !== null && numericValue < minValue) return true
    if (maxValue !== null && numericValue > maxValue) return true
    return false
  }

  private getBoundValue(value: string): number | null {
    if (value === undefined || value === null || value === '') return null
    const parsedValue = Number(value)
    return Number.isNaN(parsedValue) ? null : parsedValue
  }

  private buildDatePickerObj(): void {
    this.datePickerObj = {
      dateFormat: this.redcapDateValidation.displayFormat,
      btnProperties: {
        expand: 'block',
        fill: 'outline',
        size: 'small',
        disabled: '',
        strong: 'true',
        color: 'secondary'
      },
      closeOnSelect: 'true'
    }
    this.redcapDateValidation.applyPickerBounds(
      this.datePickerObj,
      this.dateValidationContext
    )
  }

  private setDateWarning(active: boolean): void {
    this.showWarningField = active
    this.useDateInputWarning = active
    this.showWarningChange.emit(active)
  }

  async emitKeyboardEvent(value) {
    value = value.toLowerCase()
    const isEnter = value === KeyboardEventType.ENTER

    if (isEnter && this.isNumericValidationType()) {
      this.inputValidation(this.textValue)
    }

    const isInvalidNumeric =
      isEnter &&
      this.isNumericValidationType() &&
      this.isInvalidNumericValue(this.textValue)

    const shouldBlockEnter =
      isEnter && (!this.canSubmitOnEnter || isInvalidNumeric)

    if (shouldBlockEnter) {
      this.useNumberInputWarning = isInvalidNumeric
      this.showWarningField = true
      this.showWarningChange.emit(this.showWarningField)
      return
    }

    this.keyboardEvent.emit(value)
  }
}
