import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'text-input',
  templateUrl: 'text-input.component.html'
})
export class TextInputComponent {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()

  @Input()
  validation: string
  @Input()
  currentlyShown

  onInputChange(value) {
    this.valueChange.emit(value)
  }
}
