import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'range-info-input',
  templateUrl: 'range-info-input.component.html'
})
export class RangeInfoInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  min = 1
  @Input()
  max = 10
  @Input()
  labelLeft = ''
  @Input()
  labelRight = ''
  @Input()
  currentlyShown
  @Input()
  responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `range-input-${this.uniqueID}`
  items: Item[] = Array()
  itemDescription: string

  ngOnInit() {
    for (let i = this.min; i <= this.max; i++) {
      this.items.push({
        id: `range-${this.uniqueID}-${i}`,
        value: i
      })
    }
  }

  onInputChange(event) {
    this.valueChange.emit(+event.target.value)
  }

  showDescription(id) {
    this.itemDescription = this.responses[id].label
  }
}
