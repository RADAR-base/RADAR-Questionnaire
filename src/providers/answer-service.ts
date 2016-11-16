import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

import { Answer } from '../models/answer';

@Injectable()
export class AnswerService {

  answers = {};

  constructor(
    public http: Http
  ) {
  }

  addAnswer(value: Answer) {
    this.answers[value.id] = value.value;
  }

  checkAnswer(id: string) {
    return this.answers.hasOwnProperty(id);
  }

}
