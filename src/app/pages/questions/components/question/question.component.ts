import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { Dialogs } from '@ionic-native/dialogs/ngx'
import { Vibration } from '@ionic-native/vibration/ngx'
import * as smoothscroll from 'smoothscroll-polyfill'

import {
  KeyboardEventType,
  NextButtonEventType
} from '../../../../shared/enums/events'
import { Answer } from '../../../../shared/models/answer'
import { Question, QuestionType } from '../../../../shared/models/question'
import { Task } from '../../../../shared/models/task'

@Component({
  selector: 'question',
  templateUrl: 'question.component.html'
})
export class QuestionComponent implements OnInit, OnChanges {
  @ViewChild('content') content
  @ViewChild('input') input

  @Input()
  question: Question
  @Input()
  questionIndex: number
  @Input()
  currentIndex: number
  @Input()
  task: Task
  @Input()
  isSectionHeaderHidden: boolean
  // isNextAutomatic: automatically slide to next upon answer
  @Input()
  isNextAutomatic: boolean
  @Output()
  answer: EventEmitter<Answer> = new EventEmitter<Answer>()
  @Output()
  nextAction: EventEmitter<any> = new EventEmitter<any>()

  value: any
  currentlyShown = false
  previouslyShown = false
  isLoading = true
  isScrollable = false
  isFieldLabelHidden = false
  margin = 32
  keyboardScrollPadding = 200
  keyboardInputOffset = 0
  inputHeight = 0
  isMatrix = false
  isAutoHeight = false
  showScrollButton = false

  NON_SCROLLABLE_SET: Set<QuestionType> = new Set([
    QuestionType.timed,
    QuestionType.audio,
    QuestionType.info,
    QuestionType.text,
    QuestionType.descriptive
  ])
  HIDE_FIELD_LABEL_SET: Set<QuestionType> = new Set([
    QuestionType.audio,
    QuestionType.descriptive
  ])
  MATRIX_INPUT_SET: Set<QuestionType> = new Set([QuestionType.matrix_radio])

  // Input set where height is set to auto
  AUTO_HEIGHT_INPUT_SET: Set<QuestionType> = new Set([
    QuestionType.radio,
    QuestionType.checkbox,
    QuestionType.yesno,
    QuestionType.slider,
    QuestionType.range,
    QuestionType.text
  ])

  SCROLLBAR_VISIBLE_SET: Set<QuestionType> = new Set([
    QuestionType.radio,
    QuestionType.checkbox
  ])

  constructor(private vibration: Vibration, private dialogs: Dialogs) {
    smoothscroll.polyfill()
    this.value = null
  }

  ngOnInit() {
    this.isScrollable = !this.NON_SCROLLABLE_SET.has(this.question.field_type)
    this.isFieldLabelHidden = this.HIDE_FIELD_LABEL_SET.has(
      this.question.field_type
    )
    this.isMatrix = this.MATRIX_INPUT_SET.has(this.question.field_type)
    this.isAutoHeight =
      this.isMatrix || this.AUTO_HEIGHT_INPUT_SET.has(this.question.field_type)
    setTimeout(() => {
      this.isLoading = false
      this.keyboardInputOffset = Math.max(
        this.input.nativeElement.offsetTop - this.keyboardScrollPadding,
        0
      )
    }, 800)
    setTimeout(() => {
      this.showScrollButton = this.isScrollbarVisible()
    }, 900)
  }

  ngOnChanges() {
    this.initRange()
    if (this.questionIndex === this.currentIndex) {
      this.currentlyShown = true
    } else {
      if (Math.abs(this.questionIndex - this.currentIndex) == 1)
        this.previouslyShown = true
      else this.previouslyShown = false
      this.currentlyShown = false
    }
  }

  emitAnswer(event: any) {
    // NOTE: On init the component fires the event once
    if (event && event !== undefined) {
      this.value = event
      this.answer.emit({
        id: this.question.field_name,
        value: this.value,
        type: this.question.field_type
      })
      if (this.question.isAutoNext)
        this.nextAction.emit(NextButtonEventType.AUTO)
      else this.nextAction.emit(NextButtonEventType.ENABLE)
    }
  }

  initRange() {
    if (
      this.question.select_choices_or_calculations &&
      this.question.select_choices_or_calculations.length > 0
    ) {
      const min = this.question.select_choices_or_calculations[0].code
      const minLabel = this.question.select_choices_or_calculations[0].label
      const max =
        this.question.select_choices_or_calculations[
          this.question.select_choices_or_calculations.length - 1
        ].code
      const maxLabel =
        this.question.select_choices_or_calculations[
          this.question.select_choices_or_calculations.length - 1
        ].label
      this.question.range = {
        min: parseInt(min.trim()),
        max: parseInt(max.trim()),
        labelLeft: minLabel.trim(),
        labelRight: maxLabel.trim()
      }
    }
  }

  onKeyboardEvent(value) {
    switch (value) {
      case KeyboardEventType.FOCUS:
        // Add delay for keyboard to show up
        setTimeout(() => {
          this.content.nativeElement.style = `padding-bottom:${this.keyboardInputOffset}px;`
          this.content.nativeElement.scrollTop = this.keyboardInputOffset
        }, 100)
        break
      case KeyboardEventType.BLUR: {
        this.content.nativeElement.style = ''
        this.content.nativeElement.scrollTop = 0
        break
      }
      case KeyboardEventType.ENTER: {
        this.nextAction.emit(NextButtonEventType.AUTO)
        break
      }
      default:
        break
    }
  }

  isScrollbarVisible() {
    if (!this.SCROLLBAR_VISIBLE_SET.has(this.question.field_type)) return false
    return (
      this.input.nativeElement.scrollHeight >
      this.input.nativeElement.clientHeight
    )
  }

  onScroll(event) {
    // This will hide/show the scroll arrow depending on the user's scroll event
    if (this.showScrollButton) {
      if (
        event &&
        event.target.scrollTop >=
          (event.target.scrollHeight - event.target.clientHeight) * 0.1
      ) {
        this.showScrollButton = false
      } else this.showScrollButton = true
    }
  }

  scrollDown() {
    const height = this.input.nativeElement.clientHeight
    this.input.nativeElement.scrollBy({
      top: height,
      left: 0,
      behavior: 'smooth'
    })
  }

  onAudioRecordStart(start: boolean) {
    if (start) this.nextAction.emit(NextButtonEventType.DISABLE)
    else this.nextAction.emit(NextButtonEventType.ENABLE)
  }
}
