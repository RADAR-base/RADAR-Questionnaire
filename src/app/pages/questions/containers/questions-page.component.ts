import { Component, OnInit, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { Insomnia } from '@ionic-native/insomnia/ngx'
import { IonSlides, NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

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
import { QuestionsService } from '../services/questions.service'
import { q } from './quest'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html',
  styleUrls: ['questions-page.component.scss']
})
export class QuestionsPageComponent implements OnInit {
  @ViewChild(IonSlides)
  slides: IonSlides

  startTime: number
  currentQuestionGroupId = 0
  nextQuestionGroupId: number
  questionOrder = [0]
  isLeftButtonDisabled = false
  isRightButtonDisabled = true
  task: Task
  taskType: AssessmentType
  questions: Question[]
  // Questions grouped by matrix group if it exists
  groupedQuestions: Map<string, Question[]>
  // Indices of questions (of the group) currently shown
  currentQuestionIndices: number[]
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
  backButtonListener: Subscription

  constructor(
    public navCtrl: NavController,
    private questionsService: QuestionsService,
    private usage: UsageService,
    private platform: Platform,
    private insomnia: Insomnia,
    private localization: LocalizationService,
    private router: Router
  ) {
    this.backButtonListener = this.platform.backButton.subscribe(() => {
      this.sendCompletionLog()
      navigator['app'].exitApp()
      // this.platform.exitApp()
    })
  }

  ionViewDidLeave() {
    this.sendCompletionLog()
    this.questionsService.reset()
    this.insomnia.allowSleepAgain()
    this.backButtonListener.unsubscribe()
  }

  ngOnInit() {
    this.task = this.router.getCurrentNavigation().extras.state as Task
    this.questionsService.getQuestionnairePayload(this.task).then(res => {
      this.initQuestionnaire(res)
      return this.updateToolbarButtons()
    })
    this.sendEvent(UsageEventType.QUESTIONNAIRE_STARTED)
    this.usage.setPage(this.constructor.name)
    this.insomnia.keepAwake()
    this.slides.lockSwipes(true)
  }

  initQuestionnaire(res) {
    this.startTime = this.questionsService.getTime()
    this.questionTitle = res.title
    this.introduction = res.introduction
    this.showIntroductionScreen = this.SHOW_INTRODUCTION_SET.has(
      res.assessment.showIntroduction
    )
    this.questions = res.questions
    this.questions = q
    this.groupedQuestions = this.groupQuestionsByMatrixGroup(this.questions)
    this.endText =
      res.endText && res.endText.length
        ? res.endText
        : this.localization.translateKey(LocKeys.FINISH_THANKS)
    this.isLastTask = res.isLastTask
    this.assessment = res.assessment
    this.taskType = res.type
    this.requiresInClinicCompletion = this.assessment.requiresInClinicCompletion
    const groupKeys = Array.from(this.groupedQuestions.keys())
    this.currentQuestionIndices = Object.keys(
      this.groupedQuestions.get(groupKeys[0])
    ).map(Number)
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
        return this.navCtrl.navigateRoot('/home')
      })
  }

  onAnswer(event) {
    if (event.id) {
      this.questionsService.submitAnswer(event)
      setTimeout(() => this.updateToolbarButtons(), 100)
    }
    if (this.questionsService.getIsNextAutomatic(event.type)) {
      this.nextQuestion()
    }
  }

  slideQuestion() {
    this.slides.lockSwipes(false)
    this.slides.slideTo(this.currentQuestionGroupId, 300)
    this.slides.lockSwipes(true)

    this.startTime = this.questionsService.getTime()
  }

  getCurrentQuestions() {
    // NOTE: For non-matrix type this will only return one question (array) but for matrix types this can be more than one
    const key = Array.from(this.groupedQuestions.keys())[
      this.currentQuestionGroupId
    ]
    return this.groupedQuestions.get(key)
  }

  submitTimestamps() {
    const currentQuestions = this.getCurrentQuestions()
    currentQuestions.forEach(q =>
      this.questionsService.recordTimeStamp(q, this.startTime)
    )
  }

  nextQuestion() {
    const questionPosition = this.questionsService.getNextQuestion(
      this.groupedQuestions,
      this.currentQuestionGroupId
    )
    this.nextQuestionGroupId = questionPosition.groupKeyIndex
    this.currentQuestionIndices = questionPosition.questionIndices
    if (this.isLastQuestion()) return this.navigateToFinishPage()
    this.questionOrder.push(this.nextQuestionGroupId)
    this.submitTimestamps()
    this.currentQuestionGroupId = this.nextQuestionGroupId
    this.slideQuestion()
    this.updateToolbarButtons()
  }

  previousQuestion() {
    const currentQuestions = this.getCurrentQuestions()
    this.questionOrder.pop()
    this.currentQuestionGroupId =
      this.questionOrder[this.questionOrder.length - 1]
    this.updateToolbarButtons()
    if (!this.isRightButtonDisabled)
      this.questionsService.deleteLastAnswers(currentQuestions)
    this.slideQuestion()
  }

  updateToolbarButtons() {
    // NOTE: Only the first question of each question group is used
    const currentQs = this.getCurrentQuestions()
    if (!currentQs) return
    this.isRightButtonDisabled =
      !this.questionsService.isAnyAnswered(currentQs) &&
      !this.questionsService.getIsAnyNextEnabled(currentQs)
    this.isLeftButtonDisabled =
      this.questionsService.getIsAnyPreviousEnabled(currentQs)
  }

  exitQuestionnaire() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_CANCELLED)
    this.navCtrl.navigateBack('/home')
    // this.navCtrl.pop({ animation: 'wp-transition' })
  }

  navigateToFinishPage() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_FINISHED)
    this.submitTimestamps()
    this.showFinishScreen = true
    this.onQuestionnaireCompleted()
    this.slides.lockSwipes(false)
    this.slides.slideTo(this.groupedQuestions.size, 500)
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
    this.usage.sendQuestionnaireEvent(type, this.task.name, this.task.timestamp)
  }

  sendCompletionLog() {
    this.usage.sendCompletionLog(
      this.task,
      this.questionsService.getAttemptProgress(this.questions.length)
    )
  }

  isLastQuestion() {
    return this.nextQuestionGroupId >= this.groupedQuestions.size
  }

  asIsOrder(a, b) {
    // NOTE: This is needed to display questions (in the view) from the map in order
    return 1
  }
}
