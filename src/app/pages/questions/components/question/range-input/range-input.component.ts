import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item } from '../../../../../shared/models/question'
import { IonicModule } from '@ionic/angular'
import { NgForOf } from '@angular/common'
import { IonCol, IonLabel, IonRadio, IonRadioGroup, IonRow } from '@ionic/angular/standalone'

let uniqueID = 0

@Component({
  selector: 'range-input',
  templateUrl: 'range-input.component.html',
  styleUrls: ['range-input.component.scss'],
  imports: [NgForOf, IonRadio, IonCol, IonRow, IonRadioGroup, IonLabel]
})
export class RangeInputComponent implements OnInit {
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

  value: number = null
  uniqueID: number = uniqueID++
  name = `range-input-${this.uniqueID}`
  items: Item[] = Array()
  colSize = '1'
  checkedItem: number = null

  ngOnInit() {
    for (let i = this.min; i <= this.max; i++) {
      this.items.push({
        id: `range-${this.uniqueID}-${i}`,
        value: i
      })
    }
    this.colSize = (12 / this.items.length).toString()
  }

  onInputChange(value) {
    this.valueChange.emit(value)
    this.checkedItem = this.items.findIndex(i => i.value == value)
  }
}
