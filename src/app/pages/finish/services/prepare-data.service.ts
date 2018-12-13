/********
  Data service to prepare data for other services
********/

import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class PrepareDataService {
  constructor(public storage: StorageService) {}

  process_QuestionnaireData(answers, timestamps): Promise<any> {
    console.log(answers)
    return Promise.all([
        this.storage.get(StorageKeys.CONFIG_VERSION),
        this.storage.get(StorageKeys.PARTICIPANTLOGIN),
      ])
      .then(([configVersion, participantLogin]) => {
        const values = Object.entries(answers)
          .map(([key, value]) => ({
            questionId: {string: key.toString()},
            // int: implicit [int, double, string]
            value: {string: value.toString()},
            startTime: timestamps[key].startTime,
            endTime: timestamps[key].endTime
          }))

        return {
          answers: values,
          configVersion: configVersion,
          patientId: participantLogin
        }
      })
      .catch(e => Promise.reject(JSON.stringify(e)))
  }
}
