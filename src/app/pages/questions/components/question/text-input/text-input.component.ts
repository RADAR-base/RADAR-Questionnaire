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
  isDateOrTime: string
  dateFormat: string

  ngOnInit() {
    this.isDateOrTime = this.getIsDateOrTime()
    if (this.isDateOrTime) this.dateFormat = this.getDateFormat()
  }

  getIsDateOrTime() {
    return this.type.includes('date') || this.type.includes('time')
  }

  getDateFormat() {
    const type = this.type.split('_')
    switch (type[0]) {
      case 'datetime':
        this.placeholder = 'Enter date and time'
        if (type[1] == 'seconds') return 'DD MMM YYYY H:mm:s'
        return 'DD MMM YYYY H:mm'
      case 'time':
        this.placeholder = 'Enter hours and minutes'
        return 'HH:mm'
      default:
        this.placeholder = 'Enter date'
        return 'MMM DD YYYY'
    }
  }

  onInputChange(value) {
    this.valueChange.emit(this.isDateOrTime ? JSON.stringify(value) : value)
  }
}
