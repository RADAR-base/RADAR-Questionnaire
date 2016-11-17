import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Content } from 'ionic-angular';

import { Question } from '../../models/question';
import { AnswerService } from '../../providers/answer-service';

@Component({
  selector: 'page-questions',
  templateUrl: 'questions.html'
})
export class QuestionsPage {

  @ViewChild(Content)
  content: Content;

  @ViewChild('questionsContainer')
  questionsContainerRef: ElementRef;
  questionsContainerEl: HTMLElement;

  currentQuestion: number = 0;
  questions: Question[];

  // TODO: gather text variables in one place. get values from server?
  txtValues = {
    next: 'NEXT',
    finish: 'FINISH'
  };
  nextBtTxt: string = this.txtValues.next;
  isNextBtDisabled: boolean = true;
  isPreviousBtVisible: boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private service: AnswerService
  ) {
  }

  ionViewDidLoad() {
    this.questions = this.navParams.data;
    this.questionsContainerEl = this.questionsContainerRef.nativeElement;
  }

  setCurrentQuestion(value = 0) {
    let min = !(this.currentQuestion + value < 0);
    let max = !(this.currentQuestion + value >= this.questions.length);
    if (min && max) {
      this.content.scrollToTop(200);

      this.currentQuestion = this.currentQuestion + value;
      this.questionsContainerEl.style.transform =
        `translateX(-${this.currentQuestion * 100}%)`;

      this.setNextDisabled();
      this.isPreviousBtVisible = !!this.currentQuestion;
      this.nextBtTxt = this.currentQuestion === this.questions.length - 1
        ? this.txtValues.finish
        : this.txtValues.next;
    }
  }

  checkAnswer() {
    let id = this.questions[this.currentQuestion].id;
    return this.service.checkAnswer(id);
  }

  setNextDisabled() {
    this.isNextBtDisabled = !this.checkAnswer();
  }

  nextQuestion() {
    if (this.checkAnswer()) {
      this.setCurrentQuestion(1);
    }
  }

  onAnswer(event) {
    if (event.id) {
      this.service.addAnswer(event);
      this.setNextDisabled();
    }
  }

  previousQuestion() {
    this.setCurrentQuestion(-1);
  }

  closePage() {
    this.navCtrl.pop();
  }
}
