import 'rxjs/add/operator/map'

import { Answer } from '../models/answer'
import { Http } from '@angular/http'
import { Injectable } from '@angular/core'

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
