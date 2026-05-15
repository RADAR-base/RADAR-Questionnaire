import { Component } from '@angular/core'

import { SliderInputComponent } from '../slider-input/slider-input.component'

@Component({
  selector: 'slider-vertical-input',
  templateUrl: 'slider-vertical-input.component.html',
  styleUrls: ['slider-vertical-input.component.scss']
})
export class SliderVerticalInputComponent extends SliderInputComponent {
  showTooltip = false

  get thumbTopPx(): number {
    const v = this.value ?? this.min
    const ratio = 1 - (v - this.min) / (this.max - this.min)
    return Math.round(ratio * 280)
  }
}
