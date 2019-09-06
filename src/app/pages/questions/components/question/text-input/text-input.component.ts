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
  showSeconds: boolean
  dateFormat: string
  timeFormat: string
  customMonthNames = []
  datetimeValue: { [key: string]: any } = {}

  constructor(private localization: LocalizationService) {}

  ngOnInit() {
    this.showDatePicker = this.type.includes('date')
    this.showTimePicker = this.type.includes('time')
    this.showSeconds = this.type.includes('seconds')
    this.initFormats()
  }

  initFormats() {
    const locale = this.localization.moment().localeData()
    this.dateFormat = locale.longDateFormat('LL').replace('MMMM', 'MMM')
    this.timeFormat = this.showSeconds
      ? locale.longDateFormat('LTS')
      : locale.longDateFormat('LT')
    this.customMonthNames = locale.monthsShort()
  }

  onInputChange(value) {
    if (typeof value === 'object') {
      Object.assign(this.datetimeValue, value)
      this.valueChange.emit(JSON.stringify(this.datetimeValue))
    } else {
      this.valueChange.emit(value)
    }
  }
}
