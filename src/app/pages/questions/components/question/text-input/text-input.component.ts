import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { Keyboard } from '@capacitor/keyboard'
import * as moment from 'moment'

import { LocalizationService } from '../../../../../core/services/misc/localization.service'
import { KeyboardEventType } from '../../../../../shared/enums/events'
import { NgIf } from '@angular/common'
import { WheelSelectorComponent } from '../../wheel-selector/wheel-selector.component'
import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '../../../../../shared/pipes/translate/translate'
import { IonDatetime, IonDatetimeButton, IonInput, IonItem, IonModal } from '@ionic/angular/standalone'

@Component({
  selector: 'app-text-input',
  templateUrl: 'text-input.component.html',
  styleUrls: ['text-input.component.scss'],
  imports: [
    WheelSelectorComponent,
    FormsModule,
    TranslatePipe,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonItem,
    IonInput
  ]
})
export class TextInputComponent implements OnInit {
  @ViewChild('content', { static: false }) content

  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()
  @Output()
  keyboardEvent: EventEmitter<string> = new EventEmitter<string>()
  @Input()
  type: string
  @Input()
  currentlyShown: boolean

  showDatePicker: boolean
  showTimePicker: boolean
  showDurationPicker: boolean
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
  DEFAULT_DATE_FORMAT = 'DD/MM/YYYY'

  datePickerObj: any = {}
  selectedDate?: string

  constructor(private localization: LocalizationService) {}

  ngOnInit() {
    this.selectedDate = this.localization
      .moment(Date.now())
      .format(this.DEFAULT_DATE_FORMAT)

    if (this.type.length) {
      this.showDatePicker = this.type.includes('date')
      this.showTimePicker = this.type.includes('time')
      this.showDurationPicker = this.type.includes('duration')
    }
    this.showTextInput =
      !this.showDatePicker && !this.showTimePicker && !this.showDurationPicker
    this.showSeconds = this.type.includes('second')
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

  emitAnswer(value) {
    if (!value) value = this.textValue
    if (typeof value !== 'string') {
      this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else this.valueChange.emit(value)
  }

  async emitKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER) await Keyboard.hide()

    this.keyboardEvent.emit(value)
  }
}
