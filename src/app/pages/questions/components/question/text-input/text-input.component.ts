import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import moment = require('moment')

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

  ngOnInit() {
    this.initMonthNames()
    this.showDatePicker = this.type.includes('date')
    this.showTimePicker = this.type.includes('time')
    this.showSeconds = this.type.includes('seconds')
    this.initFormats()
  }

  initMonthNames() {
    for (let x = 1; x <= 12; x++)
      this.customMonthNames.push(moment(x, 'M').format('MMM'))
  }

  initFormats() {
    this.dateFormat = 'MMM DD YYYY'
    this.timeFormat = this.showSeconds ? 'HH:mm:ss' : 'HH:mm'
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
