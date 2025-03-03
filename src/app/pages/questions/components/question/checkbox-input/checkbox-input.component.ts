import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'
import { NgForOf } from '@angular/common'
import { IonCheckbox, IonItem, IonLabel, IonList } from '@ionic/angular/standalone'

let uniqueID = 0

@Component({
  selector: 'app-checkbox-input',
  templateUrl: 'checkbox-input.component.html',
  styleUrls: ['checkbox-input.component.scss'],
  imports: [NgForOf, IonItem, IonList, IonCheckbox, IonLabel]
})
export class CheckboxInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<any> = new EventEmitter<any>()

  @Input()
  responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `checkbox-input-${this.uniqueID}`
  items: any[] = Array()
  itemsSelected = {}

  ngOnInit() {
    this.responses.map((item, i) => {
      this.items.push({
        id: `check-${this.uniqueID}-${i}`,
        response: item.label,
        value: item.code,
        checked: false
      })
    })
  }

  onInputChange(event) {
    event.checked = !event.checked
    this.logSelectedItems(event)
    this.valueChange.emit(this.retrieveSelectedItems())
  }

  logSelectedItems(item) {
    if (!(item.id in this.itemsSelected) && item.checked)
      this.itemsSelected[item.id] = item.value
    else delete this.itemsSelected[item.id]
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
