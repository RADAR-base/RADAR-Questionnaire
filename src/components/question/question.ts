import { Component, EventEmitter, Input, Output } from '@angular/core'
import { Question, QuestionType } from '../../models/question'
import { Answer } from '../../models/answer'

@Component({
  selector: 'question',
  templateUrl: 'question.html'
})
export class QuestionComponent {

  @Input() question: Question
  @Output() answer: EventEmitter<Answer> = new EventEmitter<Answer>()

  value: number

  onValueChange (event) {
    // on init the component fires the event once
    if (event === undefined) return

    switch (this.question.type) {
      case QuestionType.radio:
      case QuestionType.range:
      case QuestionType.slider:
        this.value = event
        break

      case QuestionType.audio:
        // TODO: add audio file reference to send
        break

      case QuestionType.timed:
      case QuestionType.info:
        // TODO: do we need to send any info?
        break
    }

    this.answer.emit({
      id: this.question.id,
      value: this.value
    })
  }
}
