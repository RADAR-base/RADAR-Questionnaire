import {Component, ElementRef, ViewChild} from '@angular/core'
import {Insomnia} from '@ionic-native/insomnia/ngx'
import {Content, NavController, NavParams, Platform} from 'ionic-angular'

import {LocalizationService} from '../../../core/services/misc/localization.service'
import {UsageService} from '../../../core/services/usage/usage.service'
import {UsageEventType} from '../../../shared/enums/events'
import {LocKeys} from '../../../shared/enums/localisations'
import {Assessment} from '../../../shared/models/assessment'
import {Question} from '../../../shared/models/question'
import {Task} from '../../../shared/models/task'
import {TaskType} from '../../../shared/utilities/task-type'
import {FinishPageComponent} from '../../finish/containers/finish-page.component'
import {QuestionsService} from '../services/questions.service'
import {QuestionsPageAnimations} from './questions-page.animation'
import {AlertService} from "../../../core/services/misc/alert.service";

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

  textValues = {
    next: this.localization.translateKey(LocKeys.BTN_NEXT),
    previous: this.localization.translateKey(LocKeys.BTN_PREVIOUS),
    finish: this.localization.translateKey(LocKeys.BTN_FINISH),
    close: this.localization.translateKey(LocKeys.BTN_CLOSE)
  }
  nextButtonText = this.localization.translateKey(LocKeys.BTN_NEXT)
  previousButtonText = this.localization.translateKey(LocKeys.BTN_NEXT)
  isNextButtonDisabled = true
  isPreviousButtonDisabled = false
  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle'
  }
  iconPrevious: string = this.iconValues.close

  task: Task
  taskType: TaskType
  questions: Question[]
  questionTitle: String
  endText: string
  isLastTask: boolean
  introduction: string
  assessment: Assessment
  showIntroduction: boolean

  showExitButton = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private localization: LocalizationService,
    private questionsService: QuestionsService,
    private usage: UsageService,
    private platform: Platform,
    private insomnia: Insomnia,
    private alertService: AlertService
  ) {
    this.platform.registerBackButtonAction(() => {
      this.sendCompletionLog()
      this.platform.exitApp()
    })
  }

  ionViewDidLoad() {
    this.init()
    this.sendEvent(UsageEventType.QUESTIONNAIRE_STARTED)
    this.usage.setPage(this.constructor.name)
    this.insomnia.keepAwake()
  }

  ionViewDidLeave() {
    this.sendCompletionLog()
    this.questionsService.reset()
    this.insomnia.allowSleepAgain()
  }

  init() {
    this.questionTitle = this.navParams.data.title
    this.introduction = this.navParams.data.introduction
    this.showIntroduction = this.navParams.data.assessment.showIntroduction
    this.questionsContainerEl = this.questionsContainerRef.nativeElement
    this.questions = this.questionsService.processQuestions(
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
      this.updateNextButton()
    }
    if (this.questionsService.getIsNextAutomatic(event.type)) {
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
    return value === null
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
    this.showExitButton = this.getLeftButtonValues().showExitButton
  }

  setCurrentQuestion(value = 0) {
    if (this.willExitQuestionnaire(value)) return this.exitQuestionnaire()
    if (this.willMoveToFinish(value)) return this.navigateToFinishPage()
    // NOTE: Record start time when question is shown
    this.startTime = this.questionsService.getTime()
    if (this.willMoveToValidQuestion(value)) {
      this.currentQuestion = this.currentQuestion + value
      this.setButtons()
      this.setProgress()
      this.slideQuestion()
      this.updateNextButton()
      this.updatePreviousButton()
      return
    }
  }

  getLeftButtonValues() {
    return !this.currentQuestion
      ? { text: this.textValues.close, icon: this.iconValues.close, showExitButton: false}
      : { text: this.textValues.previous, icon: this.iconValues.previous, showExitButton: true }
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
      this.currentQuestion,
      this.questions.length
    )
  }

  updateNextButton() {
    this.isNextButtonDisabled = !this.questionsService.isAnswered(
      this.getCurrentQuestionID()
    )
  }

  updatePreviousButton() {
    this.isPreviousButtonDisabled = this.questionsService.getIsPreviousDisabled(
      this.questions[this.currentQuestion].field_type
    )
  }

  nextQuestion() {
    if (this.questionsService.isAnswered(this.getCurrentQuestionID())) {
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
    if (this.isPreviousButtonDisabled === false) {
      if (!this.isNextButtonDisabled) this.questionsService.deleteLastAnswer()
      const inc = this.questionIncrements.length
        ? -this.questionIncrements.pop()
        : null
      this.setCurrentQuestion(inc)
    }
  }

  stopQuestionnaire() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_INTERRUPTED)
    this.alertService.showAlert({
      title: "Are you sure you want to quit this survey?",
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_YES),
          handler: () => {
            console.log('Want to exit now')
            this.sendEvent(UsageEventType.WANT_TO_EXIT_NOW)
            this.exitQuestionnaire()
          }
        },
        {
          text: this.localization.translateKey(LocKeys.BTN_NO),
          handler: () => {
            this.sendEvent(UsageEventType.WANT_TO_CONTINUE)
            console.log('Dont want to exit now')
          }
        }
      ],
      message: "Your progress will be lost. But you can redo it later!"
    })

  }

  exitQuestionnaire() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_CANCELLED)
    this.navCtrl.pop()
  }

  navigateToFinishPage() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_FINISHED)
    const data = this.questionsService.getData()
    this.navCtrl.setRoot(
      FinishPageComponent,
      {
        endText: this.endText,
        task: this.task,
        isLastTask: this.isLastTask,
        answers: data.answers,
        timestamps: data.timestamps,
        questions: this.questions,
        assessment: this.assessment
      },
      { animate: true, direction: 'forward' }
    )
  }

  sendEvent(type) {
    this.usage.sendQuestionnaireEvent(type, this.task)
  }

  sendCompletionLog() {
    this.usage.sendCompletionLog(
      this.task,
      this.questionsService.getAttemptProgress(this.questions.length)
    )
  }
}
