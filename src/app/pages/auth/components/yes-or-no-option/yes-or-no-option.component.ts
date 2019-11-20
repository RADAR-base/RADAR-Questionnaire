import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import {Item, Response} from "../../../../shared/models/question";


let uniqueID = 0

@Component({
  selector: 'yes-or-no-option',
  templateUrl: 'yes-or-no-option.component.html'
})
export class YesOrNoOptionComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  question: string
  // @Input()
  // responses: Response[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `yes-or-no-input-${this.uniqueID}`
  // items: Item[] = Array()

  ngOnInit() {
    // this.responses.map((item, i) => {
    //   this.items.push({
    //     id: `radio-${this.uniqueID}-${i}`,
    //     response: item.label,
    //     value: item.code
    //   })
    // })
  }

  onInputChange(event) {
    console.log('yes or not test input', event)
    this.valueChange.emit(event)
  }
}
