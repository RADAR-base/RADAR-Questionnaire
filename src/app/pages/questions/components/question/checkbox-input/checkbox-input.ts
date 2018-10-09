import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Response } from '../../../../../shared/models/question'

let uniqueID = 0

export interface Item {
  id: string
  response: string
  value: any
}

@Component({
  selector: 'checkbox-input',
  templateUrl: 'checkbox-input.html'
})
export class CheckboxInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `checkbox-input-${this.uniqueID}`
  items: Item[] = Array()
  itemsSelected = {}

  ngOnInit() {
    this.responses.map((item, i) => {
      const codeChecked = this.checkCode(item.code)
      this.items.push({
        id: `check-${this.uniqueID}-${i}`,
        response: item.label,
        value: codeChecked
      })
    })
  }

  checkCode(code) {
    if (code.includes('\r')) {
      return code.substr(2)
    }
    return code
  }

  test(event) {
    this.itemsSelected[event.target.id] = event.target.value
    console.log(this.itemsSelected)
  }

  onInputChange(event) {
    this.logSelectedItems(event.target)
    const selectedItems = this.retrieveSelectedItems().toString()
    console.log(selectedItems)
    this.valueChange.emit(+selectedItems)
  }

  logSelectedItems(item) {
    if (!(item.id in this.itemsSelected)) {
      this.itemsSelected[item.id] = item.value
    } else {
      delete this.itemsSelected[item.id]
    }
  }

  retrieveSelectedItems() {
    const items = []
    for (const key in this.itemsSelected) {
      if (key) {
        items.push(this.itemsSelected[key])
      }
    }
    return items
  }
}
