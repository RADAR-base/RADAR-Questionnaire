import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Content, ViewController, App } from 'ionic-angular';

import { Question } from '../../models/question';
import { AnswerService } from '../../providers/answer-service';
import { FinishPage } from '../finish/finish';

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
    previous: 'PREVIOUS',
    finish: 'FINISH',
    close: 'CLOSE',
  };
  nextBtTxt: string = this.txtValues.next;
  previousBtTxt: string = this.txtValues.close;
  isNextBtDisabled: boolean = true;
  isPreviousBtVisible: boolean = false;

  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle',
  };
  iconPrevious: string = this.iconValues.close;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public appCtrl: App,
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
    let finish = (this.currentQuestion + value === this.questions.length);
    let back = (this.currentQuestion + value === -1);

    if (min && max) {
      this.content.scrollToTop(200);

      this.currentQuestion = this.currentQuestion + value;
      this.questionsContainerEl.style.transform =
        `translateX(-${this.currentQuestion * 100}%)`;

      this.iconPrevious = !this.currentQuestion
        ? this.iconValues.close
        : this.iconValues.previous;

      this.previousBtTxt = !this.currentQuestion
        ? this.txtValues.close
        : this.txtValues.previous;

      this.nextBtTxt = this.currentQuestion === this.questions.length - 1
        ? this.txtValues.finish
        : this.txtValues.next;

      this.setNextDisabled();
    }
    else if (finish) {
      this.navCtrl.push(FinishPage);
      this.navCtrl.removeView(this.viewCtrl);
    }
    else if (back) {
      this.navCtrl.pop();
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
}
