import { Injectable } from '@angular/core'
import { Http } from '@angular/http'
import 'rxjs/add/operator/map'

import { Answer } from '../models/answer'

@Injectable()
export class AnswerService {

  answers = {}
  audioRecordStatus: boolean = false;

  constructor (
    public http: Http
  ) {
  }

  add (value: Answer) {
    this.answers[value.id] = value.value
  }

  check (id: string) {
    return this.answers.hasOwnProperty(id)
  }

  reset () {
    this.answers = {}
  }
  setAudioRecordStatus(status) {
    this.audioRecordStatus = status
  }
  getAudioRecordStatus() {
    return this.audioRecordStatus
  }

}
