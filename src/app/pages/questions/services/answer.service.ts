import 'rxjs/add/operator/map'

import { Answer } from '../../../shared/models/answer'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

@Injectable()
export class AnswerService {
  answers = {}
  keys = []

  constructor(public http: HttpClient) {}

  add(value: Answer) {
    this.answers[value.id] = value.value
    if (!this.check(value.id)) this.keys.push(value.id)
  }

  pop() {
    console.log(this.keys)
    this.keys.pop()
  }

  check(id: string) {
    return this.keys.includes(id)
  }

  reset() {
    this.answers = {}
    this.keys = []
  }
}
