import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { QuestionsPage } from '../questions/questions';
import { QuestionService } from '../../providers/question-service';
import { Question } from '../../models/question';
import { AnswerService } from '../../providers/answer-service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  loader;
  questions: Question[];
  isLoading: Boolean = true;
  isOpenPageClicked: Boolean = false;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private questionService: QuestionService,
    private answerService: AnswerService
  ) {
  }

  ionViewDidLoad() {
    this.questionService.get()
      .delay(2000)
      .subscribe(
        questions => this.serviceReady(questions),
        error => this.handleError(error)
      );
  }

  ionViewDidEnter() {
    this.answerService.reset();
  }

  handleOpenPage() {
    this.isOpenPageClicked = true;

    if (this.isLoading) {
      this.startLoader();
    } else {
      this.openPage();
    }
  }

  handleError(error) {
    console.error(error);

    if (this.loader) {
      this.loader.dismissAll();
    }
  }

  serviceReady(questions) {
    this.questions = questions;
    this.isLoading = false;

    if (this.isOpenPageClicked) {
      this.openPage();
    }
  }

  startLoader() {
    this.loader = this.loadingCtrl.create({
      content: "Please wait...",
      dismissOnPageChange: true
    }).present();
  }

  openPage() {
    this.navCtrl.push(QuestionsPage, this.questions);
  }

}
