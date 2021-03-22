import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'matrix-radio-input',
  templateUrl: 'matrix-radio-input.component.html'
})
export class MatrixRadioInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `radio-input-${this.uniqueID}`
  items: Item[] = Array()

  ngOnInit() {
    this.responses.map((item, i) => {
      this.items.push({
        id: `radio-${this.uniqueID}-${i}`,
        response: item.label,
        value: item.code
      })
    })
    setTimeout(() => {
      this.onInputChange(this.responses[0].code)
    }, 500)
  }

  onInputChange(event) {
    this.valueChange.emit(event)
  }
}
