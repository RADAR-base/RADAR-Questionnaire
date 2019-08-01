import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'introduction',
  templateUrl: 'introduction.component.html'
})
export class IntroductionComponent {
  @Input()
  introduction
  @Input()
  title
  @Output()
  hide: EventEmitter<any> = new EventEmitter<any>()

  constructor() {}

  hideIntro() {
    this.hide.emit()
  }
}
