import { Component, OnInit, ViewChild } from '@angular/core'
import { Insomnia } from '@ionic-native/insomnia/ngx'
import { NavController, NavParams, Platform, Slides } from 'ionic-angular'

import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../shared/enums/events'
import { LocKeys } from '../../../shared/enums/localisations'
import {
  Assessment,
  AssessmentType,
  ShowIntroductionType
} from '../../../shared/models/assessment'
import { Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { QuestionsService } from '../services/questions.service'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html'
})
export class QuestionsPageComponent implements OnInit {
  @ViewChild(Slides)
  slides: Slides

  startTime: number
  currentQuestionId = 0
  nextQuestionId: number
  questionOrder = [0]
  isLeftButtonDisabled = false
  isRightButtonDisabled = true
  task: Task
  taskType: AssessmentType
  questions: Question[]
  // Questions grouped by matrix group if it exists
  groupedQuestions: Map<string, Question[]>
  questionTitle: string
  endText: string
  isLastTask: boolean
  requiresInClinicCompletion: boolean
  introduction: string
  assessment: Assessment
  showIntroductionScreen: boolean
  showDoneButton: boolean
  showFinishScreen: boolean
  SHOW_INTRODUCTION_SET: Set<boolean | ShowIntroductionType> = new Set([
    true,
    ShowIntroductionType.ALWAYS,
    ShowIntroductionType.ONCE
  ])
  MATRIX_FIELD_NAME = 'matrix'

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private questionsService: QuestionsService,
    private usage: UsageService,
    private platform: Platform,
    private insomnia: Insomnia,
    private localization: LocalizationService
  ) {
    this.platform.registerBackButtonAction(() => {
      this.sendCompletionLog()
      this.platform.exitApp()
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

  ngOnInit() {
    this.task = this.navParams.data
    return this.questionsService
      .getQuestionnairePayload(this.task)
      .then(res => {
        this.initQuestionnaire(res)
        return this.updateToolbarButtons()
      })
  }

  initQuestionnaire(res) {
    this.startTime = this.questionsService.getTime()
    this.questionTitle = res.title
    this.introduction = res.introduction
    this.showIntroductionScreen = this.SHOW_INTRODUCTION_SET.has(
      res.assessment.showIntroduction
    )
    this.questions = res.questions
    this.groupedQuestions = this.groupQuestionsByMatrixGroup(this.questions)
    this.endText =
      res.endText && res.endText.length
        ? res.endText
        : this.localization.translateKey(LocKeys.FINISH_THANKS)
    this.isLastTask = res.isLastTask
    this.assessment = res.assessment
    this.taskType = res.type
    this.requiresInClinicCompletion = this.assessment.requiresInClinicCompletion
  }

  groupQuestionsByMatrixGroup(questions: Question[]) {
    const groupedQuestions = new Map<string, Question[]>()
    questions.forEach(q => {
      const key = q.field_type.includes(this.MATRIX_FIELD_NAME)
        ? q.matrix_group_name
        : q.field_name
      const entry = groupedQuestions.get(key) ? groupedQuestions.get(key) : []
      entry.push(q)
      groupedQuestions.set(key, entry)
    })

    return groupedQuestions
  }

  handleIntro(start: boolean) {
    this.showIntroductionScreen = false
    this.questionsService.updateAssessmentIntroduction(
      this.assessment,
      this.taskType
    )
    if (start) {
      this.slides.update()
      this.slideQuestion()
    } else this.exitQuestionnaire()
  }

  handleFinish(completedInClinic?: boolean) {
    return this.questionsService
      .handleClinicalFollowUp(this.assessment, completedInClinic)
      .then(() => {
        this.updateDoneButton(false)
        return this.navCtrl.setRoot(HomePageComponent)
      })
  }

  onAnswer(event) {
    if (event.id) {
      this.questionsService.submitAnswer(event)
      this.updateToolbarButtons()
    }
    if (this.questionsService.getIsNextAutomatic(event.type)) {
      this.nextQuestion()
    }
  }

  slideQuestion() {
    this.slides.lockSwipes(false)
    this.slides.slideTo(this.currentQuestionId, 300)
    this.slides.lockSwipes(true)

    this.startTime = this.questionsService.getTime()
  }

  getCurrentQuestions() {
    // NOTE: For non-matrix type this will only return one question (array) but for matrix types this can be more than one
    const key = Array.from(this.groupedQuestions.keys())[this.currentQuestionId]
    return this.groupedQuestions.get(key)
  }

  submitTimestamps() {
    const currentQuestions = this.getCurrentQuestions()
    currentQuestions.forEach(q =>
      this.questionsService.recordTimeStamp(q, this.startTime)
    )
  }

  nextQuestion() {
    this.nextQuestionId = this.questionsService.getNextQuestion(
      this.groupedQuestions,
      this.currentQuestionId
    )
    if (this.isLastQuestion()) return this.navigateToFinishPage()
    this.questionOrder.push(this.nextQuestionId)
    this.submitTimestamps()
    this.currentQuestionId = this.nextQuestionId
    this.slideQuestion()
    this.updateToolbarButtons()
  }

  previousQuestion() {
    this.questionOrder.pop()
    this.currentQuestionId = this.questionOrder[this.questionOrder.length - 1]
    this.updateToolbarButtons()
    if (!this.isRightButtonDisabled) this.questionsService.deleteLastAnswer()
    this.slideQuestion()
  }

  updateToolbarButtons() {
    // NOTE: Only the first question of each question group is used
    const currentQuestionsFirstQ = this.getCurrentQuestions()[0]
    this.isRightButtonDisabled =
      !this.questionsService.isAnswered(currentQuestionsFirstQ) &&
      !this.questionsService.getIsNextEnabled(currentQuestionsFirstQ.field_type)
    this.isLeftButtonDisabled = this.questionsService.getIsPreviousDisabled(
      currentQuestionsFirstQ.field_type
    )
  }

  exitQuestionnaire() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_CANCELLED)
    this.navCtrl.pop({ animation: 'wp-transition' })
  }

  navigateToFinishPage() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_FINISHED)
    this.submitTimestamps()
    this.showFinishScreen = true
    this.onQuestionnaireCompleted()
    this.slides.lockSwipes(false)
    this.slides.slideTo(this.questions.length, 500)
    this.slides.lockSwipes(true)
  }

  onQuestionnaireCompleted() {
    return this.questionsService
      .processCompletedQuestionnaire(this.task, this.questions)
      .then(() => this.updateDoneButton(true))
  }

  updateDoneButton(val: boolean) {
    this.showDoneButton = val
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

  isLastQuestion() {
    return this.nextQuestionId >= this.questions.length
  }

  asIsOrder(a, b) {
    // NOTE: This is needed to display questions (in the view) from the map in order
    return 1
  }
}
