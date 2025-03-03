import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { IonContent, IonicModule } from '@ionic/angular'
import DOMPurify from "dompurify";

import { InfoItem } from '../../../../../shared/models/question'
import { NgIf } from '@angular/common'

let uniqueID = 0

@Component({
  selector: 'descriptive-input',
  templateUrl: 'descriptive-input.component.html',
  styleUrls: ['descriptive-input.component.scss'],
  imports: [IonicModule, NgIf]
})
export class DescriptiveInputComponent implements OnInit, OnChanges {
  @ViewChild('content', { static: false }) content: IonContent

  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>()
  @Input()
  text: string
  @Input()
  currentlyShown: boolean

  value: number = null
  uniqueID: number = uniqueID++
  name = `info-${this.uniqueID}`
  items: InfoItem[] = Array()
  showScrollButton: boolean
  sanitizedHtml: any

  HTML_ALLOWED_TAGS = ['iframe']
  HTML_ALLOWED_ATTR = ['allow', 'allowfullscreen', 'frameborder', 'scrolling']

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(
      DOMPurify.sanitize(this.text, {
        ADD_TAGS: this.HTML_ALLOWED_TAGS,
        ADD_ATTR: this.HTML_ALLOWED_ATTR
      })
    )
  }

  ngOnChanges() {
    if (this.currentlyShown) this.emitTimestamp()
  }

  scrollDown() {
    this.content.getScrollElement().then(el => {
      const height = el.clientHeight / this.text.length
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
