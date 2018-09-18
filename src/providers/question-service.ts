import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError as observableThrowError } from 'rxjs'

import { Assessment } from '../models/assessment'

@Injectable()
export class QuestionService {
  assessments: Assessment[]

  private url = 'assets/data/config.json'

  constructor(private http: HttpClient) {}

  get(): Observable<Assessment[]> {
    return this.http
      .get(this.url)
      .map(this.extractData)
      .catch(this.handleError)
  }

  private extractData(res: any) {
    const body = res.json()
    return body.assessments || []
  }

  private handleError(error: any) {
    let errMsg: string

    // TODO: Fix types
    // if (error instanceof any) {
    //   const body = error.json() || ''
    //   const err = body.error || JSON.stringify(body)
    //   errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    // } else {
    //   errMsg = error.message ? error.message : error.toString()
    // }

    errMsg = error.message ? error.message : error.toString()

    console.error(errMsg)
    return observableThrowError(errMsg)
  }
}
