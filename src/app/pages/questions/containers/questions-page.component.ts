import { Component, OnInit, ViewChild } from '@angular/core'
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
  templateUrl: 'questions-page.component.html'
})
export class QuestionsPageComponent implements OnInit {
  @ViewChild(Slides)
  slides: Slides

  startTime = Date.now()
  currentQuestionId = 0
  questionIncrements = [0]
  isNextButtonDisabled = true
  isPreviousButtonDisabled = false
  task: Task
  taskType: TaskType
  questions: Question[]
  questionTitle: String
  endText: string
  isLastTask: boolean
  isClinicalTask: boolean
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
    private insomnia: Insomnia
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
      return (this.isClinicalTask = this.taskType == TaskType.CLINICAL)
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

  handleIntro(start: boolean) {
    this.showIntroductionScreen = false
    this.questionsService.updateAssessmentIntroduction(
      this.assessment,
      this.taskType
    )
    if (start) {
      this.slides.update()
      this.slideQuestion()
    } else this.exitQuestionnaire
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
    this.slides.slideTo(this.currentQuestionId, 300)
    this.slides.lockSwipes(true)

    this.startTime = this.questionsService.getTime()
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionId]
  }

  updateNextButton() {
    this.isNextButtonDisabled = !this.questionsService.isAnswered(
      this.getCurrentQuestion()
    )
  }

  updatePreviousButton() {
    this.isPreviousButtonDisabled = this.questionsService.getIsPreviousDisabled(
      this.getCurrentQuestion()
    )
  }

  submitTimestamps() {
    this.questionsService.recordTimeStamp(
      this.getCurrentQuestion(),
      this.startTime
    )
  }

  nextQuestion() {
    this.submitTimestamps()
    this.currentQuestionId = this.questionsService.getNextQuestion(
      this.questions,
      this.currentQuestionId
    )
    this.questionIncrements.push(this.currentQuestionId)
    this.slideQuestion()
    this.updateNextButton()
    this.updatePreviousButton()
  }

  previousQuestion() {
    if (!this.isNextButtonDisabled) this.questionsService.deleteLastAnswer()
    this.questionIncrements.pop()
    this.currentQuestionId = this.questionIncrements[
      this.questionIncrements.length - 1
    ]
    this.slideQuestion()
  }

  exitQuestionnaire() {
    this.sendEvent(UsageEventType.QUESTIONNAIRE_CLOSED)
    this.navCtrl.pop()
  }

  navigateToFinishPage() {
    this.submitTimestamps()
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
