import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

@Component({
  selector: 'text-input',
  templateUrl: 'text-input.component.html'
})
export class TextInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()

  @Input()
  type

  placeholder = 'Enter text'
  isDateTime: string
  dateFormat: string

  ngOnInit() {
    this.isDateTime = this.getIsDateTime()
    if (this.isDateTime) this.dateFormat = this.getDateFormat()
  }

  getIsDateTime() {
    return this.type.includes('date') || this.type.includes('time')
  }

  getDateFormat() {
    const type = this.type.split('_')[0]
    const format = this.type.split('_')[1]
    switch (type) {
      case 'datetime':
        this.placeholder = 'Enter date and time'
        if (format == 'seconds') return 'D MMM YYYY H:mm:s'
        return 'D MMM YYYY H:mm'
      case 'time':
        this.placeholder = 'Enter hours and minutes'
        return 'H:mm'
      default:
        this.placeholder = 'Enter date'
        return 'MMM D YYYY'
    }
  }

  onInputChange(value) {
    this.valueChange.emit(this.isDateTime ? JSON.stringify(value) : value)
  }
}
