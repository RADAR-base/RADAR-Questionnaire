import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'slider-input',
  templateUrl: 'slider-input.html'
})
export class SliderInputComponent {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  min = 0
  @Input()
  max = 100
  @Input()
  step = 10

  value: number = null

  onInputChange() {
    this.valueChange.emit(this.value)
  }
}
