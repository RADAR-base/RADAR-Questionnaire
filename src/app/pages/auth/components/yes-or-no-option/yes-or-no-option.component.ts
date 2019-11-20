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

  responses: any = [{label: "Yes", code: true}, {label: "No", code: false}]
  value: number = null
  uniqueID: number = uniqueID++
  name = `yes-or-no-${this.uniqueID}`
  items: Item[] = Array()


  ngOnInit() {
    // this.responses= [{label: "Yes", code: true}, {label: "No", code: false}]
    this.responses.map((item, i) => {
      this.items.push({
        id: `yes-or-no-${this.uniqueID}-${i}`,
        response: item.label,
        value: item.code
      })
    })
  }

  onInputChange(event) {
    console.log("test yes or no click", event)
    this.valueChange.emit(event)
  }
}
