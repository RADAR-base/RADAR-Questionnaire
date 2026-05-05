import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { Keyboard } from '@capacitor/keyboard'
import { ModalController } from '@ionic/angular'
import { Ionic4DatepickerModalComponent } from '@logisticinfotech/ionic4-datepicker'
import * as moment from 'moment'

import { LocalizationService } from '../../../../../core/services/misc/localization.service'
import { KeyboardEventType } from '../../../../../shared/enums/events'

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
  requiredField: string | boolean = false
  @Input()
  textValidationMin: string
  @Input()
  textValidationMax: string

  showDatePicker: boolean
  showTimePicker: boolean
  showDurationPicker: boolean
  showWarningField = false
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
  DEFAULT_DATE_FORMAT = 'DD/MM/YYYY'

  constructor(
    private localization: LocalizationService,
    public modalCtrl: ModalController
  ) { }

  ngOnInit() {
    if (this.validationType.length) {
      this.showDatePicker = this.validationType.includes('date')
      this.showTimePicker = this.validationType.includes('time')
      this.showDurationPicker = this.validationType.includes('duration')
      this.inputModeType = this.validationType === 'number' ? 'numeric' : 'text'
      this.inputType = this.validationType === 'number' ? 'number' : 'text'
    }
    this.showTextInput =
      !this.showDatePicker && !this.showTimePicker && !this.showDurationPicker
    this.showSeconds = this.validationType.includes('second')
    this.initValues()
  }

  initValues() {
    if (this.showDatePicker) this.initDates()
    if (this.showTimePicker) this.initTime()
    if (this.showDurationPicker) this.initDuration()
  }

  initDates() {
    const momentInstance = this.localization.moment(Date.now()) // Use a local instance
    this.datePickerObj = {
      dateFormat: this.DEFAULT_DATE_FORMAT,
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
    const month = moment.monthsShort()
    const day = this.addLeadingZero(Array.from(Array(32).keys()).slice(1, 32))
    const year = Array.from(Array(31).keys()).map(d => String(d + 2000))
    this.datePickerValues = { day, month, year }
    this.defaultDatePickerValue = {
      day: momentInstance.format('DD'),
      month: momentInstance.format('MMM'),
      year: momentInstance.format('YYYY')
    }
    this.emitAnswer(this.defaultDatePickerValue)
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
  selectedDate: string = this.localization
    .moment(Date.now())
    .format(this.DEFAULT_DATE_FORMAT)

  async openDatePicker() {
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
      let date = moment(data.data.date, this.DEFAULT_DATE_FORMAT)
      this.selectedDate = date.isValid()
        ? date.format(this.DEFAULT_DATE_FORMAT)
        : this.selectedDate

      this.defaultDatePickerValue = {
        year: date.format('YYYY'),
        month: date.format('M'),
        day: date.format('D')
      }
      this.emitAnswer(this.defaultDatePickerValue)
    })
  }

  emitAnswer(value) {
    if (!value) value = this.textValue
    if (typeof value !== 'string') {
      this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else {
      this.numberInputValidation(value)
      this.valueChange.emit(value)
    }
  }

  numberInputValidation(value) {
    const isOptionalBlankText =
      this.validationType === 'number' &&
      this.isBlankTextInput &&
      !this.isRequiredField
    const isNumberType = this.validationType === 'number'
    const isNumericValue = /^[\d]*$/.test(value)
    const hasMinMaxViolation =
      isNumberType &&
      !isOptionalBlankText &&
      isNumericValue &&
      this.isOutOfRange(value)

    if (
      isNumberType &&
      !isOptionalBlankText &&
      (!isNumericValue || hasMinMaxViolation)
    ) {
      this.showWarningField = true
      if (!isNumericValue) {
        console.log(`You can't enter non-numeric value: ${value}`)
      }
    } else {
      this.showWarningField = false
    }
    this.showWarningChange.emit(this.showWarningField)
  }

  private isOutOfRange(value: string): boolean {
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) return false
    if (this.hasMinValue && numericValue < this.minValue) return true
    if (this.hasMaxValue && numericValue > this.maxValue) return true
    return false
  }

  private get hasMinValue(): boolean {
    return this.textValidationMin !== undefined && this.textValidationMin !== null && this.textValidationMin !== ''
  }

  private get hasMaxValue(): boolean {
    return this.textValidationMax !== undefined && this.textValidationMax !== null && this.textValidationMax !== ''
  }

  private get minValue(): number {
    return Number(this.textValidationMin)
  }

  private get maxValue(): number {
    return Number(this.textValidationMax)
  }

  private get isBlankTextInput(): boolean {
    return (
      typeof this.textValue === 'string' &&
      this.textValue.trim().length === 0
    )
  }

  private get isRequiredField(): boolean {
    return (
      this.requiredField === true ||
      this.requiredField === 'true' ||
      this.requiredField === '1'
    )
  }

  async emitKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER) {
      if (this.isBlankTextInput && this.isRequiredField) {
        this.showWarningField = true
        this.showWarningChange.emit(this.showWarningField)
        return
      }
      if (this.showWarningField) {
        return
      }
      await Keyboard.hide()
    }
    this.keyboardEvent.emit(value)
  }
}
