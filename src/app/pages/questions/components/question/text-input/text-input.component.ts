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
  datePickerValues: any[]
  timeFormat: string
  timePickerValues: any[]
  durationPickerValues: any[]

  value = {}

  constructor(private localization: LocalizationService) {}

  ionViewDidLoad() {}

  ngOnInit() {
    this.showDatePicker = this.type.includes('date')
    this.showTimePicker = this.type.includes('time')
    this.showDurationPicker = this.type.includes('duration')
    this.showTextInput = this.type.includes('text')
    this.showSeconds = this.type.includes('seconds')
    this.initValues()
  }

  initValues() {
    const locale = this.localization.moment().localeData()
    const months = locale.monthsShort()
    const days = this.addLeadingZero(Array.from(Array(32).keys()).slice(1, 32))
    const years = Array.from(Array(21).keys()).map(d => d + 2000)
    this.datePickerValues = [months, days, years]

    const hours = this.addLeadingZero(Array.from(Array(13).keys()).slice(1, 13))
    const minutes = this.addLeadingZero(
      Array.from(Array(60).keys()).slice(1, 60)
    )
    const meridiem = ['AM', 'PM']
    this.timePickerValues = [hours, minutes, meridiem]
    if (this.showSeconds) this.timePickerValues.push(minutes)

    const duration = this.addLeadingZero(Array.from(Array(100).keys()))
    this.durationPickerValues = [duration, duration]
  }

  addLeadingZero(values) {
    return values.map(d => (d < 10 ? '0' + d : d))
  }

  emitDate(date) {
    this.value['date'] = date
    this.valueChange.emit(JSON.stringify(this.value))
  }

  emitTime(time) {
    this.value['time'] = time
    this.valueChange.emit(JSON.stringify(this.value))
  }

  emitText(text) {
    this.valueChange.emit(text)
  }

  emitDuration(duration) {
    this.value['duration'] = duration
    this.valueChange.emit(JSON.stringify(this.value))
  }
}
