import 'rxjs/add/operator/delay'
import { Component } from '@angular/core'
import { LoadingController, NavController, NavParams } from 'ionic-angular'
import { QuestionsPage } from '../questions/questions'
import { QuestionService } from '../../providers/question-service'
import { Question } from '../../models/question'
import { Assessment } from '../../models/assessment'
import { AnswerService } from '../../providers/answer-service'

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  loader

  assessment: Assessment
  assessmentIndex: number
  introduction: String = ""
  questions: Question[]
  isLoading: Boolean = true
  isOpenPageClicked: Boolean = false

  txtValues = {
    next: 'NEXT',
    previous: 'PREVIOUS',
    finish: 'FINISH'
  }
  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle'
  }
  iconClose: string = this.iconValues.close

  constructor (
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    private questionService: QuestionService,
    private answerService: AnswerService
  ) {
  }

  ionViewDidLoad () {
    this.assessmentIndex = this.navParams.data.assessmentIndex
    this.questionService.get()
      .delay(0)
      .subscribe(
        assessments => this.serviceReady(assessments),
        error => this.handleError(error)
      )
  }

  ionViewDidEnter () {
    this.answerService.reset()
  }

  handleOpenPage () {
    this.isOpenPageClicked = true

    if (this.isLoading) {
      this.startLoader()
    } else {
      this.openPage()
    }
  }

  handleClosePage () {
    this.navCtrl.pop()
  }

  handleError (error) {
    console.error(error)

    if (this.loader) {
      this.loader.dismissAll()
    }
  }

  serviceReady (assessments) {
    this.readyAssessment(assessments[this.assessmentIndex])
    this.readyQuestions(assessments[this.assessmentIndex])
  }

  readyAssessment (assessment) {
    // need to resolve this with async pipe properly
    this.assessment = assessment
    this.introduction = assessment.startText
  }

  readyQuestions (assessment) {
    this.questions = assessment.questions
    this.isLoading = false
    if (this.isOpenPageClicked) {
      this.openPage()
    }
  }

  startLoader () {
    this.loader = this.loadingCtrl.create({
      content: 'Please wait...',
      dismissOnPageChange: true
    }).present()
  }

  openPage () {
    this.navCtrl.push(QuestionsPage, {'questions':this.questions, 'endText':this.assessment.endText})
  }
}
