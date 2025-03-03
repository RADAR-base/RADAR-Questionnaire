import { Component, EventEmitter, Input, Output } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'slider-input',
  templateUrl: 'slider-input.component.html',
  styleUrls: ['slider-input.component.scss'],
  imports: [IonicModule, FormsModule]
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
  @Input()
  labelLeft = ''
  @Input()
  labelRight = ''

  value: number = null

  onInputChange() {
    this.valueChange.emit(this.value)
  }
}
