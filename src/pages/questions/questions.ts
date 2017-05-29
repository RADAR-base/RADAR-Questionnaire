import { Component, ElementRef, ViewChild } from '@angular/core'
import { App, Content, NavController, NavParams, ViewController, Platform } from 'ionic-angular'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile'
import { Device } from '@ionic-native/device'
import { Question } from '../../models/question'
import { AnswerService } from '../../providers/answer-service'
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

  // TODO: gather text variables in one place. get values from server?
  txtValues = {
    next: 'NEXT',
    previous: 'PREVIOUS',
    finish: 'FINISH',
    close: 'CLOSE'
  }

  nextBtTxt = this.txtValues.next
  previousBtTxt = this.txtValues.close
  isNextBtDisabled = true
  isPreviousBtVisible = false
  platform = false
  permission = false
  audio = false
  fileName: string
  questionID
  audioRecordStatus = false

  answer = {
    id: null,
    value: null
  }

  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle'
  }

  iconPrevious = this.iconValues.close

  constructor (
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public appCtrl: App,
    private answerService: AnswerService,
    private appPlatform: Platform,
    private device: Device
  ) {
    // Stop opensmile when application is on pause
    document.addEventListener('pause', () => {
      this.stopOpensmile()
    })
    // Stop opensmile when back button is pressed
    document.addEventListener('backbutton', () => {
      this.stopOpensmile()
    })
  }

  ionViewDidLoad () {
    this.questions = this.navParams.data
    this.questionsContainerEl = this.questionsContainerRef.nativeElement

    // Checking whether questionnaire contains any audio-type questions
    if (this.questions.find(question => question.type === 'audio')) {
      this.audio = true
    }

    console.log(this.questions.find(question => question.type === 'audio'))

    // Checking for platform and permission
    if (this.device.platform === 'Android') {
      this.platform = true

      // Checking permissions only if platform is android
      if (this.audio === true) {
        this.checkPermissions()
      }
    } else {
      this.platform = false
    }

    this.setCurrentQuestion()
  }

  // Checking permission for audio recording and external storage
  checkPermissions () {
    const permissions = cordova.plugins.permissions
    const permissionList = [
      permissions.RECORD_AUDIO,
      permissions.WRITE_EXTERNAL_STORAGE
    ]

    permissions.requestPermissions(permissionList, (status) => {
      if (status.hasPermission) {
        this.permission = true
      } else {
        errorCallback('could not set permission')
      }
    }, errorCallback)

    function errorCallback (error) {
      alert('Permission not set')
      console.error(error)
    }
  }

  success (message) {
    // add message
  }

  failure () {
    alert('Error calling OpenSmile Plugin')
  }

  setFileName (fileName) {
    this.fileName = fileName
  }

  setQuestionID (qid) {
    this.questionID = qid
  }

  setAudioRecordStatus (status) {
    this.audioRecordStatus = status
  }

  getAudioRecordStatus () {
    return this.audioRecordStatus
  }

  stopOpensmile () {
    if (this.getAudioRecordStatus()) {
      opensmile.stop('Stop', this.success, this.failure)
      this.setAudioRecordStatus(false)
      this.readFile()
    }
  }

  readFile () {
    let ansB64 = null
    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + '/' + this.fileName, (fileEntry) => {
      fileEntry.file((file) => {
        const reader = new FileReader()
        reader.onloadend = (e: any) => {
          ansB64 = e.target.result
          this.answer.id = this.questionID
          const displayDate = new Date()
          const date = displayDate.toISOString()
          this.answer.value = ansB64
          this.answerService.add(this.answer)
        }
        reader.readAsDataURL(file)
      }, errorCallback)
    }, errorCallback)
    function errorCallback (error) {
      alert('ERROR: ' + error.code)
    }
  }

  setCurrentQuestion (value = 0) {
    // FIXME: this should be done in the service that fetches the questionnaires!
    // Checking for platform and if it is not android, audio questions will be skipped, don't show it to user
    // if (this.platform === false) {
    //   while (this.questions[this.currentQuestion + value].type === 'audio') {
    //     this.answer.id = this.questions[this.currentQuestion + value].id
    //     this.answer.value = 'Platform not supported'
    //     this.answerService.add(this.answer)
    //     if (value <= -1) {
    //       value = value - 1
    //     } else {
    //       value = value + 1
    //     }
    //     if (this.currentQuestion + value < 0) {
    //       value = 0
    //     }
    //     if (this.currentQuestion + value === this.questions.length) {
    //       break
    //     }
    //   }
    // }

    if (this.audio) {
      this.stopOpensmile()
    }

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

  setProgress () {
    const tick = Math.ceil(100 / this.questions.length)
    const percent = Math.ceil(this.currentQuestion * 100 / this.questions.length)
    this.progress = percent + tick
  }

  getPermission () {
    return this.permission
  }

  checkAnswer () {
    const id = this.questions[this.currentQuestion].id
    return this.answerService.check(id)
  }

  setNextDisabled () {
    this.isNextBtDisabled = !this.checkAnswer()
  }

  nextQuestion () {
    if (this.checkAnswer()) {
      this.setCurrentQuestion(1)
    }
  }

  onAnswer (event) {
    if (event.id) {
      this.answerService.add(event)
      this.setNextDisabled()
    }
  }

  previousQuestion () {
    this.setCurrentQuestion(-1)
  }
}
