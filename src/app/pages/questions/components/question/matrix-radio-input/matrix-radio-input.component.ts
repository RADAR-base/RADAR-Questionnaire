import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core'

import { Item, Response } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'matrix-radio-input',
  templateUrl: 'matrix-radio-input.component.html',
  styleUrls: ['matrix-radio-input.component.scss']
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
    this.valueChange.emit(event)
  }
}
