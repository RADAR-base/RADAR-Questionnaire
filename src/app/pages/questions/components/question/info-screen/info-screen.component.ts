import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'

import { InfoItem, Section } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'info-screen',
  templateUrl: 'info-screen.component.html'
})
export class InfoScreenComponent implements OnInit, OnChanges {
  @ViewChild('content') content

  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()

  @Input()
  sections: Section[]
  @Input()
  hasFieldLabel: boolean
  @Input()
  currentlyShown: boolean
  @Input()
  image: string

  value: number = null
  uniqueID: number = uniqueID++
  name = `info-${this.uniqueID}`
  items: InfoItem[] = Array()
  showScrollButton: boolean

  constructor() {}

  ngOnInit() {
    this.initSections()
  }

  ngOnChanges() {
    if (this.sections.length > 1) this.showScrollButton = true
    else if (this.currentlyShown) this.emitTimestamp()
  }

  initSections() {
    this.sections.map((item, i) => {
      if (item.label.includes('THINC-it'))
        this.image = 'assets/imgs/thincIt_app_icon.png'
      this.items.push({
        id: `info-${this.uniqueID}-${i}`,
        heading: item.code,
        content: item.label
      })
    })
  }

  scrollDown() {
    const height =
      this.content.nativeElement.clientHeight / this.sections.length
    this.content.nativeElement.scrollBy({
      top: height,
      left: 0,
      behavior: 'smooth'
    })
  }

  onScroll(event) {
    if (
      event &&
      event.target.scrollTop >=
        (event.target.scrollHeight - event.target.clientHeight) * 0.8
    ) {
      this.emitTimestamp()
      this.showScrollButton = false
    } else this.showScrollButton = true
  }

  emitTimestamp() {
    // NOTE: Save timestamp (epoch) and activate the next button
    this.valueChange.emit(new Date().getTime())
  }
}
