import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'
import { IonicModule } from '@ionic/angular'
import { NgForOf } from '@angular/common'
import { IonItem, IonLabel, IonList, IonRadio, IonRadioGroup } from '@ionic/angular/standalone'
import { FormsModule } from '@angular/forms'

let uniqueID = 0

@Component({
  selector: 'radio-input',
  templateUrl: 'radio-input.component.html',
  styleUrls: ['radio-input.component.scss'],
  imports: [
    NgForOf,
    IonList,
    IonRadioGroup,
    IonItem,
    IonRadio,
    IonLabel,
    FormsModule
  ]
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

  selected: number | null = null

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
    this.selected = event
    this.valueChange.emit(this.selected)
  }
}
