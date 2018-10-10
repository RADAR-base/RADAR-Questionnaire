import { Component, ElementRef, ViewChild } from '@angular/core'
import {
  App,
  Content,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular'

import { LocKeys } from '../../../shared/enums/localisations'
import { Question, QuestionType } from '../../../shared/models/question'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
import { FinishPageComponent } from '../../finish/containers/finish-page.component'
import { AnswerService } from '../services/answer.service'
import { TimeStampService } from '../services/timestamp.service'

@Component({
  selector: 'page-questions',
  templateUrl: 'questions-page.component.html'
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

  // timestamps
  startTime: number
  endTime: number

  // next question increment
  nextQuestionIncrVal: number = 0

  // TODO: gather text variables in one place. get values from server?
  txtValues = {
    next: this.translate.transform(LocKeys.BTN_NEXT.toString()),
    previous: this.translate.transform(LocKeys.BTN_PREVIOUS.toString()),
    finish: this.translate.transform(LocKeys.BTN_FINISH.toString()),
    close: this.translate.transform(LocKeys.BTN_CLOSE.toString())
  }
  nextBtTxt: string = this.txtValues.next
  previousBtTxt: string = this.txtValues.close
  isNextBtDisabled = true
  isPreviousBtDisabled = false

  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle'
  }
  iconPrevious: string = this.iconValues.close

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public appCtrl: App,
    private answerService: AnswerService,
    private timestampService: TimeStampService,
    private translate: TranslatePipe
  ) {}

  ionViewDidLoad() {
    this.answerService.reset()
    this.timestampService.reset()
    this.questionTitle = this.navParams.data.title
    this.questions = this.navParams.data.questions
    this.questionsContainerEl = this.questionsContainerRef.nativeElement
    this.nextQuestionIncrVal = this.evalIfFirstQuestionnaireToSkipESMSleepQuestion()
    this.setCurrentQuestion(this.nextQuestionIncrVal)
  }

  evalIfFirstQuestionnaireToSkipESMSleepQuestion() {
    const time = new Date()
    if (time.getHours() > 8 && this.questionTitle === 'ESM') {
      return 1
    }
    return 0
  }

  evalIfLastQuestionnaireToShowESMRatingQuestion(currentQuestionId) {
    const time = new Date()
    if (this.questionTitle === 'ESM' && currentQuestionId === 'esm_beep') {
      if (time.getHours() >= 19) {
        return 0
      }
      return 1
    }
    return 0
  }

  setCurrentQuestion(value = 0) {
    // record start time when question is shown
    this.startTime = this.timestampService.getTimeStamp() / 1000
    const min = !(this.currentQuestion + value < 0)
    const max = !(this.currentQuestion + value >= this.questions.length)
    const finish = this.currentQuestion + value === this.questions.length
    const back = this.currentQuestion + value === -value

    if (min && max) {
      this.content.scrollToTop(200)

      this.currentQuestion = this.currentQuestion + value
      this.setProgress()

      this.questionsContainerEl.style.transform = `translateX(-${this
        .currentQuestion * 100}%)`

      this.iconPrevious = !this.currentQuestion
        ? this.iconValues.close
        : this.iconValues.previous

      this.previousBtTxt = !this.currentQuestion
        ? this.txtValues.close
        : this.txtValues.previous

      this.nextBtTxt =
        this.currentQuestion === this.questions.length - 1
          ? this.txtValues.finish
          : this.txtValues.next

      this.setNextDisabled()

      if (
        this.questions[this.currentQuestion].field_type === QuestionType.timed
      ) {
        this.setPreviousDisabled()
      } else {
        this.setPreviousEnabled()
      }
    } else if (finish) {
      this.navigateToFinishPage()
      this.navCtrl.removeView(this.viewCtrl)
    } else if (back) {
      this.navCtrl.pop()
    }
  }

  setProgress() {
    const percent = Math.ceil(
      (this.currentQuestion * 100) / this.questions.length
    )
    this.progress = percent
  }

  checkAnswer() {
    const id = this.questions[this.currentQuestion].field_name
    return this.answerService.check(id)
  }

  setNextDisabled() {
    this.isNextBtDisabled = !this.checkAnswer()
  }

  setPreviousDisabled() {
    this.isPreviousBtDisabled = true
  }

  setPreviousEnabled() {
    this.isPreviousBtDisabled = false
  }

  nextQuestion() {
    if (this.checkAnswer()) {
      // record end time when pressed "Next"
      this.endTime = this.timestampService.getTimeStamp() / 1000

      // take current question id to record timestamp
      const id = this.questions[this.currentQuestion].field_name
      this.recordTimeStamp(id)

      this.nextQuestionIncrVal = this.evalSkipNext()
      this.nextQuestionIncrVal += this.evalIfLastQuestionnaireToShowESMRatingQuestion(
        id
      )
      this.setCurrentQuestion(this.nextQuestionIncrVal)
    }
  }

  navigateToFinishPage() {
    this.navCtrl.push(FinishPageComponent, {
      endText: this.navParams.data.endText,
      associatedTask: this.navParams.data.associatedTask,
      answers: this.answerService.answers,
      timestamps: this.timestampService.timestamps
    })
  }

  evalSkipNext() {
    let increment = 1
    let questionIdx = this.currentQuestion + 1
    if (questionIdx < this.questions.length) {
      while (this.questions[questionIdx].evaluated_logic !== '') {
        const logic = this.questions[questionIdx].evaluated_logic
        const responses = this.answerService.answers
        // tslint:disable-next-line:no-eval
        if (eval(logic) === false) {
          increment += 1
          questionIdx += 1
        } else {
          return increment
        }
      }
      return increment
    }
    return increment
  }

  recordTimeStamp(questionId) {
    this.timestampService.add({
      id: questionId,
      value: {
        startTime: this.startTime,
        endTime: this.endTime
      }
    })
  }

  onAnswer(event) {
    if (event.id) {
      this.answerService.add(event)
      this.setNextDisabled()
    }
    if (event.type === QuestionType.timed) {
      this.nextQuestion()
    }
  }

  previousQuestion() {
    if (this.isPreviousBtDisabled === false) {
      this.setCurrentQuestion(-this.nextQuestionIncrVal)
      if (this.previousBtTxt === this.txtValues.close) {
        this.navCtrl.pop()
      }
    }
  }
}
