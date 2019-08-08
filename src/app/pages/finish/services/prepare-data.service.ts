/********
  Data service to prepare data for other services
********/

import { Injectable } from '@angular/core'

import { LogService } from '../../../core/services/misc/log.service'
import { QuestionType } from '../../../shared/models/question'

@Injectable()
export class PrepareDataService {
  constructor(
    private logger: LogService,
  ) {}

  processQuestionnaireData(data) {
    this.logger.log('Answers to process', data.answers)
    const values = Object.entries(data.answers).map(([key, value]) => ({
      questionId: { string: key.toString() },
      value: { string: value.toString() },
      startTime: data.timestamps[key].startTime,
      endTime: data.timestamps[key].endTime
    }))
    return {
      answers: values,
      configVersion: '',
      time: this.getTimeStart(data.questions, values),
      timeCompleted: this.getTimeCompleted(values)
    }
  }

  getTimeStart(questions, answers) {
    // NOTE: Do not include info screen as start time
    const index = questions.findIndex(q => q.field_type !== QuestionType.info)
    return index > -1 ? answers[index].startTime : answers[0].startTime
  }

  getTimeCompleted(answers) {
    return answers[answers.length - 1].endTime
  }
}
