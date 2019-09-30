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
  datePickerLabels = ['Month', 'Day', 'Year']
  timePickerValues: string[][]
  defaultTimePickerValue: string[]
  timePickerLabels = ['Hours', 'Minutes']
  durationPickerValues: string[][]
  durationLabels = ['Hours', 'Minutes']

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
    this.datePickerValues = [months, days, years]
    this.defaultDatePickerValue = [
      moment.format('MMM'),
      moment.format('DD'),
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
    this.timePickerLabels.push('Meridiem')
    this.defaultTimePickerValue = [
      moment.format('hh'),
      moment.format('mm'),
      moment.format('A')
    ]
  }

  initDuration() {
    const minutes = this.addLeadingZero(Array.from(Array(60).keys()))
    if (this.showSeconds) this.timePickerValues.push(minutes)
    const longHours = this.addLeadingZero(Array.from(Array(24).keys()))
    this.durationPickerValues = [longHours, minutes]
  }

  addLeadingZero(values) {
    return values.map(d => (d < 10 ? '0' + d : d)).map(String)
  }

  emitAnswer(value) {
    if (typeof value !== 'string') {
      this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else this.valueChange.emit(value)
  }
}
