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
import * as DomPurify from 'dompurify'

import { InfoItem } from '../../../../../shared/models/question'

let uniqueID = 0

@Component({
  selector: 'descriptive-input',
  templateUrl: 'descriptive-input.component.html'
})
export class DescriptiveInputComponent implements OnInit, OnChanges {
  @ViewChild('content') content

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
      DomPurify.sanitize(this.text, {
        ADD_TAGS: this.HTML_ALLOWED_TAGS,
        ADD_ATTR: this.HTML_ALLOWED_ATTR
      })
    )
  }

  ngOnChanges() {
    if (this.currentlyShown) this.emitTimestamp()
  }

  scrollDown() {
    const height =
      this.content.nativeElement.clientHeight / (this.text.length / 100)
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
