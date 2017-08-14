import 'rxjs/add/operator/delay'
import { Component } from '@angular/core'
import { LoadingController, NavController, NavParams } from 'ionic-angular'
import { QuestionsPage } from '../questions/questions'
import { Question } from '../../models/question'
import { Assessment } from '../../models/assessment'
import { AnswerService } from '../../providers/answer-service'
import { TimeStampService } from '../../providers/timestamp-service'
import { Task } from '../../models/task'

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {

  associatedTask: Task
  introduction: String = ""
  title: String = ""
  questions: Question[]
  endText: String

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    private questionService: QuestionService,
    private timestampService: TimeStampService,
    private answerService: AnswerService
  ) {
    this.associatedTask = this.navParams.data.associatedTask
    this.title = this.navParams.data.title
    this.introduction = this.navParams.data.introduction
    this.questions = this.navParams.data.questions
    this.endText = this.navParams.data.endText
  }

  ionViewDidLoad() {
    this.assessmentIndex = this.navParams.data.assessmentIndex
    this.questionService.get()
      .delay(0)
      .subscribe(
      assessments => this.serviceReady(assessments),
      error => this.handleError(error)
      )

    ionViewDidEnter() {
      this.answerService.reset()
      this.timestampService.reset()
    }

    handleOpenPage() {
      this.isOpenPageClicked = true

      if (this.isLoading) {
        this.startLoader()
      } else {
        this.openPage()
      }
    }

    handleClosePage() {
      this.navCtrl.pop()
    }

    handleError(error) {
      console.error(error)

      if (this.loader) {
        this.loader.dismissAll()
      }
    }

    serviceReady(assessments) {
      this.readyAssessment(assessments[this.assessmentIndex])
      this.readyQuestions(assessments[this.assessmentIndex])
    }

    readyAssessment(assessment) {
      // need to resolve this with async pipe properly
      this.assessment = assessment
      this.introduction = assessment.startText
      this.title = assessment.name
    }

    readyQuestions(assessment) {
      this.questions = assessment.questions
      this.isLoading = false
      if (this.isOpenPageClicked) {
        this.openPage()
      }
    }

    startLoader() {
      this.loader = this.loadingCtrl.create({
        content: 'Please wait...',
        dismissOnPageChange: true
      }).present()
    }


    openPage() {
      this.navCtrl.push(QuestionsPage, {
        'associatedTask': this.associatedTask,
        'questions': this.questions,
        'endText': this.endText
      })

    }
  }
