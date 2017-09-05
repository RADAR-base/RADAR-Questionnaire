import { Component, ElementRef, ViewChild } from '@angular/core'
import { App, Content, NavController, NavParams, ViewController, Platform } from 'ionic-angular'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
import { Device } from '@ionic-native/device'
import { Question } from '../../models/question'
import { AnswerService } from '../../providers/answer-service'
import { TimeStampService } from '../../providers/timestamp-service'
import { AudioRecordService } from '../../providers/audiorecord-service'
import { FinishPage } from '../finish/finish'

declare var cordova: any
declare var window: any


@Component({
  selector: 'page-questions',
  templateUrl: 'questions.html'
})
export class QuestionsPage {

  @ViewChild(Content)
  content: Content

  @ViewChild('questionsContainer')
  questionsContainerRef: ElementRef
  questionsContainerEl: HTMLElement

  progress = 0
  currentQuestion = 0
  questions: Question[]

  //timestamps
  startTime: number
  endTime: number

  // TODO: gather text variables in one place. get values from server?
  txtValues = {
    next: 'NEXT',
    previous: 'PREVIOUS',
    finish: 'FINISH',
    close: 'CLOSE'
  }
  nextBtTxt: string = this.txtValues.next
  previousBtTxt: string = this.txtValues.close
  isNextBtDisabled = true
  isPreviousBtVisible = false
  platform: boolean = false
  permission: boolean = false
  audio: boolean = false
  permissions = null


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
    appPlatform: Platform,
    private device: Device,
    private timestampService: TimeStampService,
    private audioRecordService: AudioRecordService
  ) {
  }

  ionViewDidLoad() {
    this.questions = this.navParams.data.questions
    this.questionsContainerEl = this.questionsContainerRef.nativeElement
    var i = 0
    //Checking whether questionnaire contains any audio-type questions
    while (i < this.questions.length) {
      if (this.questions[i].type == 'audio') {
        this.audio = true
        break
      }
      i = i + 1
    }

    this.setCurrentQuestion()
  }

  setCurrentQuestion(value = 0) {

    // record start time when question is shown
    this.startTime = this.timestampService.getTimeStamp() // returns : milliseconds / 1000

    const min = !(this.currentQuestion + value < 0)
    const max = !(this.currentQuestion + value >= this.questions.length)
    const finish = (this.currentQuestion + value === this.questions.length)
    const back = (this.currentQuestion + value === -1)

    if (min && max) {
      this.content.scrollToTop(200)

      this.currentQuestion = this.currentQuestion + value
      this.setProgress()

      this.questionsContainerEl.style.transform =
        `translateX(-${this.currentQuestion * 100}%)`

      this.iconPrevious = !this.currentQuestion
        ? this.iconValues.close
        : this.iconValues.previous

      this.previousBtTxt = !this.currentQuestion
        ? this.txtValues.close
        : this.txtValues.previous

      this.nextBtTxt = this.currentQuestion === this.questions.length - 1
        ? this.txtValues.finish
        : this.txtValues.next

      this.setNextDisabled()
    } else if (finish) {
      this.navCtrl.push(FinishPage)
      this.navCtrl.removeView(this.viewCtrl)
    } else if (back) {
      this.navCtrl.pop()
    }
  }

  setProgress() {
    const tick = Math.ceil(100 / this.questions.length)
    const percent = Math.ceil(this.currentQuestion * 100 / this.questions.length)
    this.progress = percent + tick
  }

  getPermission() {
    return this.permission
  }

  checkAnswer() {
    const id = this.questions[this.currentQuestion].id
    return this.answerService.check(id)
  }

  setNextDisabled() {
    this.isNextBtDisabled = !this.checkAnswer()
  }
  recordTimeStamp(questionId) {

    this.timestampService.add({
      "id": questionId,
      "value": {
        "startTime": this.startTime,
        "endTime": this.endTime
      }
    })
  }
  nextQuestion() {
    if (this.checkAnswer()) {

      // record end time when pressed "Next"
      this.endTime = this.timestampService.getTimeStamp() // returns : milliseconds / 1000

      //take current question id to record timestamp
      const id = this.questions[this.currentQuestion].id
      this.recordTimeStamp(id)

      this.setCurrentQuestion(1)
    }
  }

  onAnswer(event) {
    if (event.id) {
      this.answerService.add(event)
      this.setNextDisabled()
    }
  }

  previousQuestion() {
    this.setCurrentQuestion(-1)
  }
}
