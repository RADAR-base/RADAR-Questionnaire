import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SecurityContext,
  ViewChild
} from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'

import {
  KeyboardEventType,
  NextButtonEventType
} from '../../../../shared/enums/events'
import { Answer } from '../../../../shared/models/answer'
import {
  Question,
  QuestionType,
  Response
} from '../../../../shared/models/question'
import { Task } from '../../../../shared/models/task'

@Component({
  selector: 'question',
  templateUrl: 'question.component.html',
  styleUrls: ['question.component.scss']
})
export class QuestionComponent implements OnInit, OnChanges {
  @ViewChild('content', { static: false }) content
  @ViewChild('input', { read: ElementRef, static: false }) inputEl

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
  @Input()
  isNextAutomatic: boolean // Automatically slide to next upon answer
  @Input()
  isMatrix = false
  @Output()
  answer: EventEmitter<Answer> = new EventEmitter<Answer>()
  @Output()
  nextAction: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  readAloud: EventEmitter<string> = new EventEmitter<string>()
  @Input()
  isReadAloudAvailable = false
  @Input()
  isReadAloudActive = false

  value: any
  currentlyShown = false
  previouslyShown = false
  isLoading = true
  isScrollable = false
  isFieldLabelHidden = false
  margin = 50
  keyboardScrollPadding = 200
  keyboardInputOffset = 0
  inputHeight = 0
  isAutoHeight = false
  showScrollButton = false
  sanitizedSectionHeader = ''
  sanitizedFieldLabel = ''
  defaultYesNoResponse: Response[] = [
    { code: '1', label: 'Yes' },
    { code: '0', label: 'No' }
  ]

  NON_SCROLLABLE_SET: Set<QuestionType> = new Set([
    QuestionType.timed,
    QuestionType.audio,
    QuestionType.guided_audio,
    QuestionType.info,
    QuestionType.text,
    QuestionType.descriptive,
    QuestionType.slider
  ])

  HIDE_FIELD_LABEL_SET: Set<QuestionType> = new Set([
    QuestionType.audio,
    QuestionType.guided_audio,
    QuestionType.descriptive,
    QuestionType.healthkit
  ])

  // Input set where height is set to auto
  AUTO_HEIGHT_INPUT_SET: Set<QuestionType> = new Set([
    QuestionType.radio,
    QuestionType.checkbox,
    QuestionType.yesno,
    QuestionType.slider,
    QuestionType.range,
    QuestionType.text,
    QuestionType.matrix_radio
  ])

  SCROLLBAR_VISIBLE_SET: Set<QuestionType> = new Set([
    QuestionType.radio,
    QuestionType.checkbox
  ])

  constructor(private sanitizer: DomSanitizer) {
    this.value = null
  }

  ngOnInit() {
    this.updateSanitizedHtml()
    this.isScrollable = !this.NON_SCROLLABLE_SET.has(this.question.field_type)
    this.isFieldLabelHidden = this.HIDE_FIELD_LABEL_SET.has(
      this.question.field_type
    )
    this.isAutoHeight =
      this.isMatrix || this.AUTO_HEIGHT_INPUT_SET.has(this.question.field_type)
    setTimeout(() => {
      this.isLoading = false
      this.keyboardInputOffset = Math.max(
        this.inputEl.nativeElement.offsetTop - this.keyboardScrollPadding,
        0
      )
    }, 800)
    setTimeout(() => {
      this.showScrollButton = this.isScrollbarVisible()
    }, 900)
  }

  ngOnChanges() {
    this.updateSanitizedHtml()
    this.initRange()
    if (this.questionIndex === this.currentIndex) {
      this.currentlyShown = true
    } else {
      this.previouslyShown =
        Math.abs(this.questionIndex - this.currentIndex) == 1
      this.currentlyShown = false
    }
  }

  emitAnswer(event: any) {
    // Only proceed if event is not null or undefined
    if (event !== null && event !== undefined) {
      this.value = event
      this.answer.emit({
        id: this.question.field_name,
        value: this.value,
        type: this.question.field_type
      })
      if (this.question.isAutoNext) {
        this.nextAction.emit(NextButtonEventType.AUTO)
      } else {
        this.nextAction.emit(NextButtonEventType.ENABLE)
      }
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
    return (
      this.SCROLLBAR_VISIBLE_SET.has(this.question.field_type) &&
      this.inputEl.nativeElement.scrollHeight >
      this.inputEl.nativeElement.clientHeight
    )
  }

  onScroll(event) {
    // This will hide/show the scroll arrow depending on the user's scroll event
    if (
      this.showScrollButton &&
      event &&
      event.target.scrollTop >=
      (event.target.scrollHeight - event.target.clientHeight) * 0.1
    ) {
      this.showScrollButton = false
    }
  }

  scrollDown() {
    const height = this.inputEl.nativeElement.clientHeight
    this.inputEl.nativeElement.scrollBy({
      top: height,
      left: 0,
      behavior: 'smooth'
    })
  }

  onAudioRecordStart(start: boolean) {
    if (start) this.nextAction.emit(NextButtonEventType.DISABLE)
    else this.nextAction.emit(NextButtonEventType.ENABLE)
  }

  onReadAloudTap() {
    if (!this.isReadAloudAvailable || !this.content?.nativeElement) return
    const text = this.content.nativeElement.innerText
      .replace(/\s+/g, ' ')
      .trim()
    this.readAloud.emit(text)
  }

  private sanitizeHtml(value: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value || '') || ''
  }

  private updateSanitizedHtml() {
    this.sanitizedSectionHeader = this.sanitizeHtml(this.question?.section_header)
    this.sanitizedFieldLabel = this.sanitizeHtml(this.question?.field_label)
  }
}
