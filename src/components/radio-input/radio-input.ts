import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Response } from '../../models/question'

let uniqueID = 0

export interface Item {
  id: string
  response: string
  value: any
}

@Component({
  selector: 'radio-input',
  templateUrl: 'radio-input.html'
})
export class RadioInputComponent implements OnInit {

  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input() responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `radio-input-${this.uniqueID}`
  items: Item[] = Array()

  ngOnInit () {
    this.responses.map((item, i) => {
      this.items.push({
        id: `radio-${this.uniqueID}-${i}`,
        response: item.response,
        value: item.score
      })
    })
  }

  onInputChange (event) {
    this.valueChange.emit(+event.target.value)
  }
}
