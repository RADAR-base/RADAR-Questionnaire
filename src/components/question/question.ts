import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core'
import { Question, QuestionType } from '../../models/question'
import { Answer } from '../../models/answer'
import { AnswerService } from '../../providers/answer-service'

@Component({
  selector: 'question',
  templateUrl: 'question.html'
})
export class QuestionComponent implements OnChanges {

  @Input() question: Question
  @Input() questionIndex: number
  @Input() currentIndex: number
  @Output() answer: EventEmitter<Answer> = new EventEmitter<Answer>()

  value: number
  currentlyShown: boolean = false

  constructor(private answerService: AnswerService) {}

  ngOnChanges() {
    if(this.questionIndex == this.currentIndex) {
      this.currentlyShown = true
    } else {
      this.currentlyShown = false
    }
  }

  onValueChange(event) {
    // on init the component fires the event once
    if (event === undefined) return

    switch (this.question.field_type) {
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
        this.value = event
        break
    }
    this.answer.emit({
      id: this.question.field_name,
      value: this.value,
      type: this.question.field_type
    })
  }
}
