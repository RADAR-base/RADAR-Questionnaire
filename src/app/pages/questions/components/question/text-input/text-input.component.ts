import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'text-input',
  templateUrl: 'text-input.component.html'
})
export class TextInputComponent {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  placeholder

  onInputChange(value) {
    this.valueChange.emit(value)
  }
}
