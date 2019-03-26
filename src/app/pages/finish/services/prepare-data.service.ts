/********
  Data service to prepare data for other services
********/

import { Injectable } from '@angular/core'

@Injectable()
export class PrepareDataService {
  constructor() {}

  processQuestionnaireData(answers, timestamps) {
    console.log(answers)
    const values = Object.entries(answers).map(([key, value]) => ({
      questionId: { string: key.toString() },
      // int: implicit [int, double, string]
      value: { string: value.toString() },
      startTime: timestamps[key].startTime,
      endTime: timestamps[key].endTime
    }))
    return values
  }
}
