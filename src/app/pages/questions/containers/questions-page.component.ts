// tslint:disable:no-eval
import { Component, ElementRef, ViewChild } from '@angular/core'
import { Content, NavController, NavParams, Platform } from 'ionic-angular'

import { LocalizationService } from '../../../core/services/misc/localization.service'
import { FirebaseAnalyticsService } from '../../../core/services/usage/firebaseAnalytics.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { Question, QuestionType } from '../../../shared/models/question'
import { TaskType } from '../../../shared/utilities/task-type'
import { FinishPageComponent } from '../../finish/containers/finish-page.component'
import { QuestionsService } from '../services/questions.service'
import { QuestionsPageAnimations } from './questions-page.animation'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html',
  animations: QuestionsPageAnimations
})
export class QuestionsPageComponent {
  @ViewChild(Content)
  content: Content

  @ViewChild('questionsContainer')
  questionsContainerRef: ElementRef
  questionsContainerEl: HTMLElement

  startTime: number
  progress = 0
  currentQuestion = 0
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

  task
  taskType: TaskType
  questions: Question[]
  questionTitle: String
  endText: string
  isLastTask: boolean
  introduction
  assessment
  showIntroduction = true

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private localization: LocalizationService,
    private questionsService: QuestionsService,
    private firebaseAnalytics: FirebaseAnalyticsService,
    private platform: Platform
  ) {
    this.onClose()
  }

  ionViewDidLoad() {
    this.init()
    this.firebaseAnalytics.logEvent('questionnaire_started', {
      questionnaire_timestamp: String(this.task.timestamp),
      type: this.task.name
    })
    this.firebaseAnalytics.setCurrentScreen('questions-page')
  }

  ionViewDidLeave() {
    this.sendCompletionLog()
    this.questionsService.sendQuestionnaireCloseEvent()
    this.questionsService.reset()
  }

  init() {
    this.questionTitle = this.navParams.data.title
    this.introduction = this.navParams.data.introduction
    // this.showIntroduction = this.navParams.data.assessment.showIntroduction
    this.questionsContainerEl = this.questionsContainerRef.nativeElement
    this.questions = this.questionsService.getQuestions(
      this.questionTitle,
      this.navParams.data.questions
    )
    this.task = this.navParams.data.task
    this.endText = this.navParams.data.endText
    this.isLastTask = this.navParams.data.isLastTask
    this.assessment = this.navParams.data.assessment
    this.taskType = this.navParams.data.taskType
    this.setCurrentQuestion(this.nextQuestionIncr)
  }

  onClose() {
    this.platform.pause.subscribe(() => this.sendCompletionLog())
    this.platform.registerBackButtonAction(() => {
      this.sendCompletionLog()
      this.platform.exitApp()
    })
  }

  sendCompletionLog() {
    this.questionsService.sendCompletionLog(this.task, this.questions.length)
  }

  hideIntro() {
    this.showIntroduction = false
    this.questionsService.updateAssessmentIntroduction(
      this.assessment,
      this.taskType
    )
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
    this.progress = this.questionsService.getAnswerProgress(
      this.questions.length
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
        task: this.task,
        isLastTask: this.isLastTask,
        answers: data.answers,
        timestamps: data.timestamps,
        questions: this.questions
      },
      { animate: true, direction: 'forward' }
    )
  }
}
