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
import {
  ValidationType,
  InputModeType
} from '../../../../../shared/models/question'

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
  requiredField = false
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
  DEFAULT_DATE_FORMAT = 'DD/MM/YYYY'
  // Regex pattern to validate numeric input (only digits allowed)
  DIGIT_PATTERN = /^\d*$/
  DIGITAL_PATTERN = /^[\d]*$/

  constructor(
    private localization: LocalizationService,
    public modalCtrl: ModalController
  ) {}

  ngOnInit() {
    if (this.validationType.length) {
      const inputModeMap = {
        [ValidationType.NUMBER]: InputModeType.NUMBER,
        [ValidationType.EMAIL]: InputModeType.EMAIL,
        [ValidationType.PHONE]: InputModeType.PHONE
      }
      this.inputModeType =
        inputModeMap[this.validationType] || InputModeType.TEXT

      this.showDatePicker = [
        ValidationType.DATE_DMY,
        ValidationType.DATE_MDY,
        ValidationType.DATE_YMD
      ].includes(this.validationType as ValidationType)
      this.showTimePicker = this.validationType === ValidationType.TIME
      this.showDurationPicker = this.validationType.includes('duration')
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
      this.inputValidation(value)
      this.valueChange.emit(value)
    }
  }

  inputValidation(value) {
    if (
      this.validationType === ValidationType.NUMBER &&
      !this.DIGIT_PATTERN.test(value)
    ) {
      this.showWarningField = true
    } else {
      this.showWarningField = false
    }
    this.showWarningChange.emit(this.showWarningField)
  }

  async emitKeyboardEvent(value) {
    value = value.toLowerCase()
    const isEnter = value === KeyboardEventType.ENTER
    const isInvalidNumber =
      isEnter &&
      this.validationType === ValidationType.NUMBER &&
      !this.DIGIT_PATTERN.test(this.textValue)

    if (isInvalidNumber) {
      this.showWarningField = true
    }

    // Block Enter if canSubmitOnEnter is false OR if the number input is invalid
    const shouldBlockEnter =
      isEnter && (!this.canSubmitOnEnter || isInvalidNumber)

    if (shouldBlockEnter) {
      this.showWarningField = true
      this.showWarningChange.emit(this.showWarningField)
      return
    }

    this.keyboardEvent.emit(value)
  }
}
