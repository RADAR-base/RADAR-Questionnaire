import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'
import { Observable } from 'rxjs/Observable'
import { Injectable } from '@angular/core'
import { Http, Response } from '@angular/http'

import { Assessment } from '../models/assessment'

@Injectable()
export class QuestionService {

  assessment: Assessment

  private url = 'assets/data/config.json'

  constructor (
    private http: Http
  ) {
  }

  get (): Observable<Assessment> {
    return this.http.get(this.url)
      .map(this.extractData)
      .catch(this.handleError)
  }

  private extractData (res: Response) {
    const body = res.json()
    return body.assessments[0] || []
  }

  private handleError (error: Response | any) {
    let errMsg: string

    if (error instanceof Response) {
      const body = error.json() || ''
      const err = body.error || JSON.stringify(body)
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    } else {
      errMsg = error.message
        ? error.message
        : error.toString()
    }

    console.error(errMsg)
    return Observable.throw(errMsg)
  }
}
