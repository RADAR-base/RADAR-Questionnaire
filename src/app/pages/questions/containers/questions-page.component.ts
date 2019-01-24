// tslint:disable:no-eval
import { animate, state, style, transition, trigger } from '@angular/animations'
import { Component, ElementRef, ViewChild } from '@angular/core'
import { Content, NavController, NavParams, Platform } from 'ionic-angular'

import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { Question, QuestionType } from '../../../shared/models/question'
import { FinishPageComponent } from '../../finish/containers/finish-page.component'
import { QuestionsService } from '../services/questions.service'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html',
  animations: [
    trigger('enterQuestions', [
      state('true', style({ transform: 'translateY(100%)' })),
      state('false', style({ transform: 'translateY(0%)' })),
      transition('*=>*', animate('200ms ease-out'))
    ])
  ]
})
export class QuestionsPageComponent {
  @ViewChild(Content)
  content: Content

  @ViewChild('questionsContainer')
  questionsContainerRef: ElementRef
  questionsContainerEl: HTMLElement

  progress = 0
  currentQuestion = 0
  questions: Question[]
  questionTitle: String

  startTime: number
  questionIncrements = []

  nextQuestionIncr: number = 0

  // TODO: Gather text variables in one place. get values from server?
  textValues = {
    next: this.localization.translateKey(LocKeys.BTN_NEXT),
    previous: this.localization.translateKey(LocKeys.BTN_PREVIOUS),
    finish: this.localization.translateKey(LocKeys.BTN_FINISH),
    close: this.localization.translateKey(LocKeys.BTN_CLOSE)
  }
  nextButtonText = this.localization.translateKey(LocKeys.BTN_NEXT)
  previousButtonText = this.localization.translateKey(LocKeys.BTN_NEXT)
  isNextBtDisabled = true
  isPreviousBtDisabled = false

  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle'
  }
  iconPrevious: string = this.iconValues.close

  associatedTask
  endText: string
  isLastTask: boolean
  title
  introduction
  assessment
  showIntroduction = true

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private localization: LocalizationService,
    private questionsService: QuestionsService,
    private platform: Platform
  ) {
    this.onClose()
  }

  ionViewDidLoad() {
    this.init()
    this.questionsService.reset()
  }

  ionViewDidLeave() {
    this.sendCompletionLog()
  }

  init() {
    this.title = this.navParams.data.title
    this.introduction = this.navParams.data.introduction
    this.showIntroduction = this.navParams.data.assessment.showIntroduction
    this.questionTitle = this.navParams.data.title
    this.questionsContainerEl = this.questionsContainerRef.nativeElement
    this.questions = this.questionsService.getQuestions(
      this.title,
      this.navParams.data.questions
    )
    this.setCurrentQuestion(this.nextQuestionIncr)
    this.associatedTask = this.navParams.data.associatedTask
    this.endText = this.navParams.data.endText
    this.isLastTask = this.navParams.data.isLastTask
    this.assessment = this.navParams.data.assessment
  }

  onClose() {
    this.platform.resume.subscribe(() => this.sendCompletionLog())
    this.platform.registerBackButtonAction(() => {
      this.sendCompletionLog()
      this.platform.exitApp()
    })
  }

  sendCompletionLog() {
    this.questionsService.sendCompletionLog(this.questions, this.associatedTask)
  }

  hideIntro() {
    this.showIntroduction = false
    this.questionsService.updateAssessmentIntroduction(this.assessment)
  }

  onAnswer(event) {
    if (event.id) {
      this.questionsService.submitAnswer(event)
      this.setNextDisabled()
    }
    if (event.type === QuestionType.timed) {
      this.nextQuestion()
    }
  }

  slideQuestion() {
    // Note: Move to next question
    this.content.scrollToTop(200)
    this.questionsContainerEl.style.transform = `translateX(-${this
      .currentQuestion * 100}%)`
  }

  willMoveToFinish(value) {
    return this.currentQuestion + value === this.questions.length
  }

  willExitQuestionnaire(value) {
    return this.currentQuestion + value === -value
  }

  willMoveToValidQuestion(value) {
    return (
      !(this.currentQuestion + value < 0) &&
      !(this.currentQuestion + value >= this.questions.length)
    )
  }

  setButtons() {
    this.iconPrevious = this.getLeftButtonValues().icon
    this.previousButtonText = this.getLeftButtonValues().text
    this.nextButtonText = this.getRightButtonText()
  }

  setCurrentQuestion(value = 0) {
    // NOTE: Record start time when question is shown
    this.startTime = this.questionsService.getTime()
    if (this.willMoveToValidQuestion(value)) {
      this.currentQuestion = this.currentQuestion + value
      this.setButtons()
      this.setProgress()
      this.slideQuestion()
      this.setNextDisabled()
      this.isPreviousBtDisabled =
        this.questions[this.currentQuestion].field_type === QuestionType.timed
      return
    }
    if (this.willMoveToFinish(value)) {
      this.navigateToFinishPage()
      return
    }
    if (this.willExitQuestionnaire(value)) {
      this.navCtrl.pop()
      return
    }
  }

  getLeftButtonValues() {
    return !this.currentQuestion
      ? { text: this.textValues.close, icon: this.iconValues.close }
      : { text: this.textValues.previous, icon: this.iconValues.previous }
  }

  getRightButtonText() {
    return this.currentQuestion === this.questions.length - 1
      ? this.textValues.finish
      : this.textValues.next
  }

  getCurrentQuestionID() {
    return this.questions[this.currentQuestion].field_name
  }

  setProgress() {
    this.progress = Math.ceil(
      (this.currentQuestion * 100) / this.questions.length
    )
  }

  setNextDisabled() {
    this.isNextBtDisabled = !this.questionsService.checkAnswer(
      this.getCurrentQuestionID()
    )
  }

  nextQuestion() {
    if (this.questionsService.checkAnswer(this.getCurrentQuestionID())) {
      // NOTE: Record timestamp and end time when pressed "Next"
      this.questionsService.recordTimeStamp(
        this.getCurrentQuestionID(),
        this.startTime
      )
      this.nextQuestionIncr = this.questionsService.getNextQuestion(
        this.questions,
        this.currentQuestion
      )
      this.setCurrentQuestion(this.nextQuestionIncr)
      this.questionIncrements.push(this.nextQuestionIncr)
    }
  }

  previousQuestion() {
    if (this.isPreviousBtDisabled === false) {
      if (
        this.previousButtonText === this.textValues.close ||
        !this.questionIncrements.length
      ) {
        this.navCtrl.pop()
      } else {
        this.questionsService.deleteLastAnswer()
        this.setCurrentQuestion(-this.questionIncrements.pop())
      }
    }
  }

  navigateToFinishPage() {
    const data = this.questionsService.getData()
    this.navCtrl.setRoot(
      FinishPageComponent,
      {
        endText: this.endText,
        associatedTask: this.associatedTask,
        answers: data.answers,
        timestamps: data.timestamps,
        isLastTask: this.isLastTask,
        questions: this.questions
      },
      { animate: true, direction: 'forward' }
    )
  }
}
