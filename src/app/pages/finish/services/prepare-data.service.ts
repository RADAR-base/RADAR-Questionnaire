/********
  Data service to prepare data for other services
********/

import { Injectable } from '@angular/core'

import { QuestionType } from '../../../shared/models/question'

@Injectable()
export class PrepareDataService {
  constructor() {}

  processQuestionnaireData(data, configVersion) {
    const answers = data.answers
    const timestamps = data.timestamps
    const questions = data.questions
    console.log(answers)

    const values = Object.entries(answers).map(([key, value]) => ({
      questionId: { string: key.toString() },
      value: { string: value.toString() },
      startTime: timestamps[key].startTime,
      endTime: timestamps[key].endTime
    }))
    return {
      answers: values,
      configVersion: configVersion,
      time: this.getTimeStart(questions, values),
      timeCompleted: this.getTimeCompleted(values)
    }
  }

  getTimeStart(questions, answers) {
    // TODO: Fix this to get proper start time from protocol
    return questions[0].field_type == QuestionType.info && questions[1] // NOTE: Do not use info startTime
      ? answers[1].startTime
      : answers[0].startTime // NOTE: whole questionnaire startTime and endTime
  }

  getTimeCompleted(answers) {
    return answers[answers.length - 1].endTime
  }
}
