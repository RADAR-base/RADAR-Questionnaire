import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'
import { IonicModule } from '@ionic/angular'
import { NgForOf } from '@angular/common'
import { IonCol, IonItem, IonLabel, IonRadio, IonRadioGroup, IonRow } from '@ionic/angular/standalone'

let uniqueID = 0

@Component({
  selector: 'matrix-radio-input',
  templateUrl: 'matrix-radio-input.component.html',
  styleUrls: ['matrix-radio-input.component.scss'],
  imports: [NgForOf, IonRow, IonRadioGroup, IonCol, IonItem, IonLabel, IonRadio]
})
export class MatrixRadioInputComponent implements OnInit, OnChanges {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  responses: Response[]
  @Input()
  currentlyShown: boolean
  @Input()
  previouslyShown: boolean

  value: number = null
  uniqueID: number = uniqueID++
  name = `radio-input-${this.uniqueID}`
  items: Item[] = Array()

  selected?: string | number

  ngOnInit() {
    this.responses.map((item, i) => {
      this.items.push({
        id: `radio-${this.uniqueID}-${i}`,
        response: item.label,
        value: item.code
      })
    })
  }

  ngOnChanges() {
    if (this.currentlyShown && !this.previouslyShown)
      setTimeout(() => this.onInputChange(this.responses[0].code), 100)
  }

  onInputChange(event) {
    this.selected = event.detail.value
    this.valueChange.emit(event.detail.value)
  }
}
