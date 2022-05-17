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

@Component({
  selector: 'text-input',
  templateUrl: 'text-input.component.html',
  styleUrls: ['text-input.component.scss']
})
export class TextInputComponent implements OnInit {
  @ViewChild('content') content

  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()
  @Output()
  textInputFocus: EventEmitter<string> = new EventEmitter<string>()
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

  value = {}

  constructor(
    private localization: LocalizationService,
    public modalCtrl: ModalController
  ) {}

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
    this.datePickerObj = {
      dateFormat: 'YYYY-MM-DD',
      btnProperties: {
        expand: 'block', // Default 'block'
        fill: 'outline', // Default 'solid'
        size: 'small', // Default 'default'
        disabled: '', // Default false
        strong: 'true', // Default false
        color: 'secondary' // Default ''
      },
      closeOnSelect: 'true'
    }
    const moment = this.localization.moment(Date.now())
    const locale = moment.localeData()
    const month = locale.monthsShort()
    const day = this.addLeadingZero(Array.from(Array(32).keys()).slice(1, 32))
    const year = Array.from(Array(31).keys()).map(d => String(d + 2000))
    this.datePickerValues = { day, month, year }
    this.defaultDatePickerValue = {
      day: moment.format('DD'),
      month: moment.format('MMM'),
      year: moment.format('YYYY')
    }
  }

  initTime() {
    const moment = this.localization.moment(Date.now())
    const hour = this.addLeadingZero(Array.from(Array(13).keys()).slice(1, 13))
    const minute = this.addLeadingZero(Array.from(Array(60).keys()))
    const second = minute
    const ampm = ['AM', 'PM']
    this.timePickerValues = { hour, minute, ampm }
    if (this.showSeconds) this.timePickerValues = { hour, minute, second, ampm }
    this.defaultTimePickerValue = {
      hour: moment.format('hh'),
      minute: moment.format('mm'),
      second: this.showSeconds ? moment.format('ss') : '00',
      ampm: moment.format('A')
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
  selectedDate: string = new Date().toLocaleDateString('en-ZA')

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
      console.log(data)
      this.selectedDate = data.data.date

      // set defaultDatepickervalue
      const split_date = data.data.date.split('-')
      this.defaultDatePickerValue = {
        year: split_date[0],
        month: moment()
          .month(parseInt(split_date[1]) - 1)
          .format('MMM'),
        day: split_date[2]
      }
      this.emitAnswer(this.defaultDatePickerValue)
    })
  }

  emitAnswer(value) {
    if (typeof value !== 'string') {
      this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else this.valueChange.emit(value)
    console.log(this.value)
  }

  emitTextInputFocus(value) {
    this.textInputFocus.emit(value)
  }
}
