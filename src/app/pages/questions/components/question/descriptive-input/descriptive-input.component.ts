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

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(this.text)
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
