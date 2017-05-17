import 'rxjs/add/operator/delay'
import { Component } from '@angular/core'
import { LoadingController, NavController } from 'ionic-angular'
import { QuestionsPage } from '../questions/questions'
import { QuestionService } from '../../providers/question-service'
import { Question } from '../../models/question'
import { Assessment } from '../../models/assessment'
import { AnswerService } from '../../providers/answer-service'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  loader

  assessment: Assessment
  questions: Question[]
  isLoading: Boolean = true
  isOpenPageClicked: Boolean = false

  constructor (
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private questionService: QuestionService,
    private answerService: AnswerService,
    private storage: Storage
  ) {
  }

  ionViewDidLoad () {
    this.questionService.get()
      .delay(2000)
      .subscribe(
        assessment => this.serviceReady(assessment),
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

  handleError (error) {
    console.error(error)

    if (this.loader) {
      this.loader.dismissAll()
    }
  }

  serviceReady (assessment) {
    this.readyAssessment(assessment)
    this.readyQuestions(assessment)
  }

  readyAssessment (assessment) {
    this.assessment = assessment
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
    this.navCtrl.push(QuestionsPage, this.questions)
  }

}
