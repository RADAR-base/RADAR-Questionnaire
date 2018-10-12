import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

import { InfoItem, Section } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'info-screen',
  templateUrl: 'info-screen.component.html'
})
export class InfoScreenComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  sections: Section[]

  value: number = null
  uniqueID: number = uniqueID++
  name = `info-${this.uniqueID}`
  isThincItReminder = false
  items: InfoItem[] = Array()

  ngOnInit() {
    this.sections.map((item, i) => {
      console.log(item.label)
      if (item.label.includes('THINC-it')) {
        this.isThincItReminder = true
      }
      this.items.push({
        id: `info-${this.uniqueID}-${i}`,
        heading: item.code,
        content: item.label
      })
    })

    // save timestamp (epoch) and activate the next button
    const epoch: number = new Date().getTime()
    this.valueChange.emit(epoch)
  }
}
