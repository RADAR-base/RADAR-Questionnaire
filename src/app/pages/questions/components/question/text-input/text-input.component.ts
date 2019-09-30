import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { LocalizationService } from '../../../../../core/services/misc/localization.service'

@Component({
  selector: 'text-input',
  templateUrl: 'text-input.component.html'
})
export class TextInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()

  @Input()
  type

  showDatePicker: boolean
  showTimePicker: boolean
  showDurationPicker: boolean
  showTextInput

  showSeconds: boolean
  datePickerValues: string[][]
  defaultDatePickerValue: string[]
  datePickerLabels = ['Day', 'Month', 'Year']
  timePickerValues: string[][]
  defaultTimePickerValue: string[]
  timePickerLabels = ['Hours', 'Minutes']
  durationPickerValues: string[][]
  defaultDurationPickerValue: string[]
  durationPickerLabels = ['Hours', 'Minutes']

  value = {}

  constructor(private localization: LocalizationService) {}

  ngOnInit() {
    this.showDatePicker = this.type.includes('date')
    this.showTimePicker = this.type.includes('time')
    this.showDurationPicker = this.type.includes('duration')
    this.showTextInput =
      this.type.includes('text') ||
      !this.type ||
      (!this.showDatePicker && !this.showTimePicker && !this.showDurationPicker)
    this.showSeconds = this.type.includes('seconds')
    this.initValues()
  }

  initValues() {
    if (this.showDatePicker) this.initDates()
    if (this.showTimePicker) this.initTime()
    if (this.showDurationPicker) this.initDuration()
  }

  initDates() {
    const moment = this.localization.moment()
    const locale = moment.localeData()
    const months = locale.monthsShort()
    const days = this.addLeadingZero(Array.from(Array(32).keys()).slice(1, 32))
    const years = Array.from(Array(31).keys()).map(d => String(d + 2000))
    this.datePickerValues = [days, months, years]
    this.defaultDatePickerValue = [
      moment.format('DD'),
      moment.format('MMM'),
      moment.format('YYYY')
    ]
  }

  initTime() {
    const moment = this.localization.moment()
    const hours = this.addLeadingZero(Array.from(Array(13).keys()).slice(1, 13))
    const minutes = this.addLeadingZero(Array.from(Array(60).keys()))
    const meridiem = ['AM', 'PM']
    this.timePickerValues = [hours, minutes]
    if (this.showSeconds) {
      this.timePickerValues.push(minutes)
      this.timePickerLabels.push('Seconds')
    }
    this.timePickerValues.push(meridiem)
    this.timePickerLabels.push('AM/PM')
    this.defaultTimePickerValue = [
      moment.format('hh'),
      moment.format('mm'),
      moment.format('A')
    ]
  }

  initDuration() {
    const minutes = this.addLeadingZero(Array.from(Array(60).keys()))
    const longHours = this.addLeadingZero(Array.from(Array(24).keys()))
    this.durationPickerValues = [longHours, minutes]
    this.defaultDurationPickerValue = ["00","00"]
  }

  addLeadingZero(values) {
    return values.map(d => (d < 10 ? '0' + d : d)).map(String)
  }

  emitAnswer(value) {
    if (typeof value !== 'string') {
      if ("date" in value) {
        const month = this.localization.moment().month(value['date'][1]).format("M")
        this.value = Object.assign(this.value, {day: value['date'][0], month: month, year: value['date'][2]})
      }
      else if ("time" in value && this.showSeconds) this.value = Object.assign(this.value, {hour: value['time'][0], minute: value['time'][1], second: value['time'][2], ampm: value['time'][3]})
      else if ("time" in value) this.value = Object.assign(this.value, {hour: value['time'][0], minute: value['time'][1], ampm: value['time'][2]})
      else if ("duration" in value) this.value = Object.assign(this.value, {hour: value['duration'][0], minute: value['duration'][1]})
      else this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else this.valueChange.emit(value)
  }
}
