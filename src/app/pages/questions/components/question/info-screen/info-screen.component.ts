import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { IonContent, IonicModule } from '@ionic/angular'

import { InfoItem, Section } from '../../../../../shared/models/question'
import { NgForOf, NgIf } from '@angular/common'
import { addIcons } from 'ionicons'
import { chevronDownCircle } from 'ionicons/icons'

let uniqueID = 0

@Component({
  selector: 'info-screen',
  templateUrl: 'info-screen.component.html',
  styleUrls: ['info-screen.component.scss'],
  imports: [IonicModule, NgIf, NgForOf]
})
export class InfoScreenComponent implements OnInit, OnChanges {
  @ViewChild('content', { static: false }) content: IonContent

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

  constructor() {
    addIcons({chevronDownCircle})
  }

  ngOnInit() {
    this.initSections()
  }

  ngOnChanges() {
    if (this.sections.length > 1) this.showScrollButton = true
    else if (this.currentlyShown) this.emitTimestamp()
  }

  initSections() {
    if (!this.sections.length) return
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
    this.content.getScrollElement().then(el => {
      const height = el.clientHeight / this.sections.length
      this.content.scrollByPoint(0, height, 300)
    })
  }

  onScroll(event) {
    if (
      event &&
      event.target.scrollHeight - event.detail.scrollTop <
        event.target.clientHeight
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
