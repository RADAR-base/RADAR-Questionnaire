/********
  Data service to prepare data for other services
********/

import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { QuestionType } from '../../../shared/models/question'

@Injectable()
export class PrepareDataService {
  constructor(public storage: StorageService) {}

  processQuestionnaireData(data): Promise<any> {
    const answers = data.answers
    const timestamps = data.timestamps
    const questions = data.questions
    console.log(answers)
    return Promise.all([
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.PARTICIPANTLOGIN)
    ])
      .then(([configVersion, participantLogin]) => {
        const values = Object.entries(answers).map(([key, value]) => ({
          questionId: { string: key.toString() },
          value: { string: value.toString() },
          startTime: timestamps[key].startTime,
          endTime: timestamps[key].endTime
        }))

        return {
          answers: values,
          configVersion: configVersion,
          patientId: participantLogin,
          time: this.getTimeStart(questions, values),
          timeCompleted: this.getTimeCompleted(values)
        }
      })
      .catch(e => Promise.reject(JSON.stringify(e)))
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
