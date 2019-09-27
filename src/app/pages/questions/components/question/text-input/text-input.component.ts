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
  dateFormat: string
  datePickerValues: string[]
  timeFormat: string
  timePickerValues: string[]
  durationPickerValues: string[]

  value = {}

  constructor(private localization: LocalizationService) {}

  ngOnInit() {
    this.showDatePicker = this.type.includes('date')
    this.showTimePicker = this.type.includes('time')
    this.showDurationPicker = this.type.includes('duration')
    this.showTextInput =
      this.type.includes('text') ||
      !this.type ||
      (!this.showDatePicker && !this.showTimePicker && this.showDurationPicker)
    this.showSeconds = this.type.includes('seconds')
    this.initValues()
  }

  initValues() {
    const locale = this.localization.moment().localeData()
    const months = locale.monthsShort()
    const days = this.addLeadingZero(Array.from(Array(32).keys()).slice(1, 32))
    const years = Array.from(Array(31).keys()).map(d => d + 2000)
    this.datePickerValues = [months, days, years]

    const hours = this.addLeadingZero(Array.from(Array(13).keys()).slice(1, 13))
    const minutes = this.addLeadingZero(Array.from(Array(60).keys()))
    const meridiem = ['AM', 'PM']
    this.timePickerValues = [hours, minutes, meridiem]
    if (this.showSeconds) this.timePickerValues.push(minutes)

    const longHours = this.addLeadingZero(
      Array.from(Array(24).keys()).slice(1, 24)
    )
    this.durationPickerValues = [longHours, minutes]
  }

  addLeadingZero(values) {
    return values.map(d => (d < 10 ? '0' + d : d))
  }

  emitAnswer(value) {
    if (typeof value !== 'string') {
      this.value = Object.assign(this.value, value)
      this.valueChange.emit(JSON.stringify(this.value))
    } else this.valueChange.emit(value)
  }
}
