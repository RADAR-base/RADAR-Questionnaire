import { Component, Input } from '@angular/core'

import { Response } from '../../../../../shared/models/question'
import { RangeInputComponent } from '../range-input/range-input.component'

@Component({
  selector: 'range-info-input',
  templateUrl: 'range-info-input.component.html',
  styleUrls: ['range-info-input.component.scss'],
  standalone: false,
})
export class RangeInfoInputComponent extends RangeInputComponent {
  @Input()
  responses: Response[]

  itemDescription: string

  onInputChange(value) {
    super.onInputChange(value)
    this.showDescription(value)
  }

  showDescription(id) {
    this.itemDescription = this.responses.find(r => r.code == id).label
  }
}
