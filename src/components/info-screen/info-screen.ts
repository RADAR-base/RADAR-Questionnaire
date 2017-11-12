import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { Section } from '../../models/question'

let uniqueID = 0

export interface Item {
  id: string
  heading: string
  content: string
}

@Component({
  selector: 'info-screen',
  templateUrl: 'info-screen.html'
})
export class InfoScreenComponent implements OnInit {

  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input() sections: Section[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `info-${this.uniqueID}`
  items: Item[] = Array()

  ngOnInit () {
    this.sections.map((item, i) => {
          this.items.push({
            id: `info-${this.uniqueID}-${i}`,
            heading: item.section_header,
            content: item.field_label
          })
        })

    // save timestamp (epoch) and activate the next button
    this.valueChange.emit((new Date).getTime())
  }

}
