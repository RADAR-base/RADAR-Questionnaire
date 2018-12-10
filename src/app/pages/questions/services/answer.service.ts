import 'rxjs/add/operator/map'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { Answer } from '../../../shared/models/answer'

@Injectable()
export class AnswerService {
  answers = {}
  lastAnswerKey: string

  constructor(public http: HttpClient) {}

  add(value: Answer) {
    this.answers[value.id] = value.value
    this.lastAnswerKey = value.id
  }

  pop() {
    this.answers[this.lastAnswerKey] = null
  }

  check(id: string) {
    return this.answers.hasOwnProperty(id)
  }

  reset() {
    this.answers = {}
  }
}
