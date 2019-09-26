import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { Content } from 'ionic-angular'

import { InfoItem, Section } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'info-screen',
  templateUrl: 'info-screen.component.html'
})
export class InfoScreenComponent implements OnInit, OnChanges {
  @ViewChild(Content) content: Content

  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  sections: Section[]
  @Input()
  hasFieldLabel: boolean
  @Input()
  currentlyShown: boolean

  value: number = null
  uniqueID: number = uniqueID++
  name = `info-${this.uniqueID}`
  isThincItReminder = false
  items: InfoItem[] = Array()
  showScrollButton: boolean

  ngOnInit() {
    this.initSections()
  }

  ngOnChanges() {
    if (this.sections.length > 1) this.showScrollButton = true
    else if (this.currentlyShown) this.emitTimestamp()
  }

  initSections() {
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
  }

  scrollDown() {
    const dimensions = this.content.getContentDimensions()
    const position = dimensions.scrollTop + dimensions.contentHeight / 2
    this.content.scrollTo(0, position, 1000)
  }

  onScroll(event) {
    if (event.scrollTop >= (event.scrollHeight - event.contentHeight) * 0.8) {
      this.emitTimestamp()
      this.showScrollButton = false
    } else this.showScrollButton = true
  }

  emitTimestamp() {
    // NOTE: Save timestamp (epoch) and activate the next button
    this.valueChange.emit(new Date().getTime())
  }
}
