import { Component, EventEmitter, Input, Output } from '@angular/core'

import { Response } from '../../../../../shared/models/question'

@Component({
  selector: 'range-info-input',
  templateUrl: 'range-info-input.component.html'
})
export class RangeInfoInputComponent {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  min = 1
  @Input()
  max = 10
  @Input()
  currentlyShown
  @Input()
  responses: Response[]

  itemDescription: string

  onInputChange(value) {
    this.showDescription(value)
    this.valueChange.emit(value)
  }

  showDescription(id) {
    this.itemDescription = this.responses[id].label
  }
}
