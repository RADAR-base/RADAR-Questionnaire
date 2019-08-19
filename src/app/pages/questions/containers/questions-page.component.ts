import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild
} from '@angular/core'
import { Insomnia } from '@ionic-native/insomnia/ngx'
import { NavController, NavParams, Platform, Slides } from 'ionic-angular'

import { UsageService } from '../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../shared/enums/events'
import { Assessment } from '../../../shared/models/assessment'
import { Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { TaskType } from '../../../shared/utilities/task-type'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { QuestionsService } from '../services/questions.service'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionsPageComponent implements OnInit {
  @ViewChild(Slides)
  slides: Slides

  startTime = Date.now()
  currentQuestion = 0
  questionIncrements = []
  nextQuestionIncr: number = 0
  isNextButtonDisabled = true
  isPreviousButtonDisabled = false
  task: Task
  taskType: TaskType
  questions: Question[]
  questionTitle: String
  endText: string
  isLastTask: boolean
  introduction: string
  assessment: Assessment
  showIntroductionScreen: boolean
  showDoneButton: boolean
  showFinishScreen: boolean

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private questionsService: QuestionsService,
    private usage: UsageService,
    private platform: Platform,
    private insomnia: Insomnia,
    private ref: ChangeDetectorRef
  ) {
    this.platform.registerBackButtonAction(() => {
      this.sendCompletionLog()
      this.platform.exitApp()
    })
  }

  ngOnInit() {
    this.task = this.navParams.data
    const data = this.questionsService.getQuestionnairePayload(this.task)
    return data.then(res => {
      this.questionTitle = res.title
      this.introduction = res.introduction
      this.showIntroductionScreen = res.assessment.showIntroduction
      this.questions = res.questions
      this.endText = res.endText
      this.isLastTask = res.isLastTask
      this.assessment = res.assessment
      this.taskType = res.type
      return this.ref.markForCheck()
    })
  }

  ionViewDidLoad() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_STARTED)
    this.usage.setPage(this.constructor.name)
    this.insomnia.keepAwake()
    this.slides.lockSwipes(true)
  }

  ionViewDidLeave() {
    this.sendCompletionLog()
    this.questionsService.reset()
    this.insomnia.allowSleepAgain()
  }

  hideIntro(exit?: boolean) {
    this.showIntroductionScreen = false
    this.questionsService.updateAssessmentIntroduction(
      this.assessment,
      this.taskType
    )
    if (exit) this.exitQuestionnaire()
  }

  handleStart() {
    this.hideIntro()
    this.slides.update()
    this.setCurrentQuestion()
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
    this.slides.lockSwipes(false)
    this.slides.slideTo(this.currentQuestion, 500)
    this.slides.lockSwipes(true)
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

  setCurrentQuestion(value = 0) {
    if (this.willExitQuestionnaire(value)) return this.exitQuestionnaire()
    if (this.willMoveToFinish(value)) return this.navigateToFinishPage()
    // NOTE: Record start time when question is shown
    this.startTime = this.questionsService.getTime()
    if (this.willMoveToValidQuestion(value)) {
      this.currentQuestion = this.currentQuestion + value
      this.slideQuestion()
      this.updateNextButton()
      this.updatePreviousButton()
      return
    }
  }

  getCurrentQuestionID() {
    return this.questions[this.currentQuestion].field_name
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

  exitQuestionnaire() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_CLOSED)
    this.navCtrl.pop()
  }

  handleFinish(completedInClinic?: boolean) {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_FINISHED)
    return this.questionsService
      .handleClinicalFollowUp(this.assessment, completedInClinic)
      .then(() => {
        this.updateDoneButton(false)
        return this.navCtrl.setRoot(HomePageComponent)
      })
  }

  navigateToFinishPage() {
    this.showFinishScreen = true
    this.onQuestionnaireCompleted()
    this.slides.lockSwipes(false)
    this.slides.slideNext(500)
    this.slides.lockSwipes(true)
  }

  onQuestionnaireCompleted() {
    return this.questionsService
      .processCompletedQuestionnaire(this.task, this.questions)
      .then(() => this.updateDoneButton(true))
  }

  updateDoneButton(val: boolean) {
    this.showDoneButton = val
    return this.ref.markForCheck
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
