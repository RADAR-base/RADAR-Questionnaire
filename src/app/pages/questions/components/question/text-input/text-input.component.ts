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

  constructor(
    private localization: LocalizationService,
    public modalCtrl: ModalController
  ) { }

  ngOnInit() {
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

  datePickerObj: any = {}
  selectedDate: string = this.localization.moment(Date.now()).format(this.DEFAULT_DATE_FORMAT)

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
      this.selectedDate = date.isValid() ? date.format(this.DEFAULT_DATE_FORMAT) : this.selectedDate

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
    } else this.valueChange.emit(value)
  }

  async emitKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER) await Keyboard.hide()

    this.keyboardEvent.emit(value)
  }
}
