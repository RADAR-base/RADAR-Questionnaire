import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'date-input',
  templateUrl: 'date-input.component.html'
})
export class DateInputComponent {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  onInputChange(date) {
    const epoch = new Date(
      date.year,
      date.month - 1,
      date.day,
      date.hour,
      date.minute
    ).getTime()
    this.valueChange.emit(epoch)
  }
}
