import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'
import { Http } from '@angular/http'

import { Answer } from '../models/answer'

@Injectable()
export class AnswerService {
  answers = {}

  constructor(public http: Http) {}

  add(value: Answer) {
    this.answers[value.id] = value.value
  }

  check(id: string) {
    return this.answers.hasOwnProperty(id)
  }

  reset() {
    this.answers = {}
  }
}
