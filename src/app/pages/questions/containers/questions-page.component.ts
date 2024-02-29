import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { NavController, Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import {
  NextButtonEventType,
  UsageEventType
} from '../../../shared/enums/events'
import { LocKeys } from '../../../shared/enums/localisations'
import {
  Assessment,
  AssessmentType,
  ShowIntroductionType
} from '../../../shared/models/assessment'
import {
  ExternalApp,
  Question,
  QuestionType
} from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { AppLauncherService } from '../services/app-launcher.service'
import { QuestionsService } from '../services/questions.service'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html',
  styleUrls: ['questions-page.component.scss']
})
export class QuestionsPageComponent implements OnInit {
  @ViewChild('swiper')
  slides: ElementRef | undefined;

  startTime: number
  currentQuestionGroupId = 0
  nextQuestionGroupId: number
  questionOrder = [0]
  allQuestionIndices = []
  isLeftButtonDisabled = false
  isRightButtonDisabled = true
  task: Task
  taskType: AssessmentType
  questions: Question[]
  externalApp: ExternalApp
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
  showFinishAndLaunchScreen: boolean = false
  externalAppCanLaunch: boolean = false
  viewEntered = false

  SHOW_INTRODUCTION_SET: Set<boolean | ShowIntroductionType> = new Set([
    true,
    ShowIntroductionType.ALWAYS,
    ShowIntroductionType.ONCE
  ])
  MATRIX_FIELD_NAME = 'matrix'
  HEALTH_FIELD_NAME = 'health'
  backButtonListener: Subscription
  showProgressCount: Promise<boolean>

  constructor(
    public navCtrl: NavController,
    private questionsService: QuestionsService,
    private usage: UsageService,
    private platform: Platform,
    private localization: LocalizationService,
    private router: Router,
    private appLauncher: AppLauncherService,
    private alertService: AlertService
  ) {
    this.backButtonListener = this.platform.backButton.subscribe(() => {
      this.sendCompletionLog()
      navigator['app'].exitApp()
    })
  }

  ionViewDidLeave() {
    KeepAwake.allowSleep()
    this.sendCompletionLog()
    this.questionsService.reset()
    this.backButtonListener.unsubscribe()
  }

  ngOnInit() {
    const nav = this.router.getCurrentNavigation()
    if (nav) {
      this.task = nav.extras.state as Task
      this.showProgressCount = this.questionsService.getIsProgressCountShown()
      this.questionsService
        .initRemoteConfigParams()
        .then(() => this.questionsService.getQuestionnairePayload(this.task))
        .then(res => {
          this.initQuestionnaire(res)
          return this.updateToolbarButtons()
        })
    }
  }

  ionViewWillEnter() {
    this.slides.nativeElement.swiper.update()
  }

  ionViewDidEnter() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_STARTED)
    this.usage.setPage(this.constructor.name)
    this.slides.nativeElement.swiper.allowSlideNext = false
    this.slides.nativeElement.swiper.allowSlidePrev = false
    KeepAwake.keepAwake()
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
    const groupKeys = Array.from(this.groupedQuestions.keys())
    this.currentQuestionIndices = Object.keys(
      this.groupedQuestions.get(groupKeys[0])
    ).map(Number)
    this.allQuestionIndices[0] = this.currentQuestionIndices
  }

  groupQuestionsByMatrixGroup(questions: Question[]) {
    const groupedQuestions = new Map<string, Question[]>()
    questions.forEach(q => {
      const key =
        q.field_type.includes(this.MATRIX_FIELD_NAME) ||
        q.field_type.includes(this.HEALTH_FIELD_NAME)
          ? q.matrix_group_name
          : q.field_name
      const entry = groupedQuestions.get(key) ? groupedQuestions.get(key) : []
      entry.push(q)
      //?
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
      this.slides.nativeElement.swiper.update()
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
    if (event.id) this.questionsService.submitAnswer(event)
  }

  slideQuestion() {
    this.slides.nativeElement.swiper.allowSlideNext = true
    this.slides.nativeElement.swiper.allowSlidePrev = true
    this.slides.nativeElement.swiper.slideTo(this.currentQuestionGroupId, 400)
    this.slides.nativeElement.swiper.allowSlideNext = false
    this.slides.nativeElement.swiper.allowSlidePrev = false
  }

  getCurrentQuestions() {
    // For non-matrix type this will only return one question (array) but for matrix types, this can be more than one
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

  nextAction(event) {
    if (event == NextButtonEventType.AUTO)
      return setTimeout(() => this.nextQuestion(), 100)
    if (event == NextButtonEventType.ENABLE)
      return setTimeout(() => this.updateToolbarButtons(), 100)
    if (event == NextButtonEventType.DISABLE)
      return (this.isRightButtonDisabled = true)
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
    this.allQuestionIndices[this.nextQuestionGroupId] =
      this.currentQuestionIndices
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
    this.currentQuestionIndices =
      this.allQuestionIndices[this.currentQuestionGroupId]
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
  }

  navigateToFinishPage() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_FINISHED)
    this.submitTimestamps()
    this.showFinishScreen = true
    this.slides.nativeElement.swiper.allowSlideNext = true
    this.slides.nativeElement.swiper.slideTo(this.groupedQuestions.size, 500)
    this.slides.nativeElement.swiper.allowSlideNext = false
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

  showDisabledButtonAlert() {
    const currentQuestionType = this.getCurrentQuestions()[0].field_type
    // NOTE: Show alert when next is tapped without finishing audio question
    if (currentQuestionType == QuestionType.audio)
      this.alertService.showAlert({
        message: this.localization.translateKey(
          LocKeys.AUDIO_TASK_BUTTON_ALERT_DESC
        ),
        buttons: [
          {
            text: this.localization.translateKey(LocKeys.BTN_DISMISS),
            handler: () => {}
          }
        ]
      })
  }

  private checkIfQuestionnaireHasAppLaunch() {
    if (
      this.externalApp &&
      this.appLauncher.isExternalAppUriValidForThePlatform(this.externalApp)
    ) {
      this.appLauncher
        .isExternalAppCanLaunch(this.externalApp, this.task)
        .then(canLaunch => {
          this.showFinishAndLaunchScreen = true
          this.externalAppCanLaunch = canLaunch
        })
        .catch(err => {
          this.showFinishAndLaunchScreen = false
          console.log(err)
        })
    }
  }
}
