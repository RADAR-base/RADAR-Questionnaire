import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'radio-input',
  templateUrl: 'radio-input.component.html'
})
export class RadioInputComponent implements OnInit {
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
  }

  onInputChange(event) {
    this.valueChange.emit(event)
  }
}
