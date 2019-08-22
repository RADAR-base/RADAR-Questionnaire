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
  start: EventEmitter<any> = new EventEmitter<any>()

  constructor() {}

  hideIntro() {
    this.start.emit(false)
  }

  startQuestionnaire() {
    this.start.emit(true)
  }
}
