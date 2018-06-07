/********
  Data service to prepare data for other services
********/

import { Injectable } from '@angular/core'

import { StorageService } from '../providers/storage-service'
import { StorageKeys } from '../enums/storage'

@Injectable()
export class PrepareDataService {

  constructor(
    public storage: StorageService
  ) {
  }

  process_QuestionnaireData(answers, timestamps): Promise<any> {

    return new Promise((resolve, reject) => {

      // fetch config version and Patient ID
      this.fetchFromStorage().then(resp => {

        var configVersion = resp[0].toString()
        var participantLogin = resp[1].toString()

        var keys = Object.keys(answers)
        var keylength = keys.length

        var answersProcessedCount = 0;
        var values = []

        for (var key in answers) {
          answersProcessedCount++
          var answer = {
            questionId: key.toString(),
            //int: implicit [int, double, string]
            value: {string: answers[key].toString()},
            startTime: timestamps[key].startTime,
            endTime: timestamps[key].endTime
          }
          values.push(answer)
          if (answersProcessedCount == keylength) {
            var processedData = {
              "answers": values,
              "configVersion": configVersion,
              "patientId": participantLogin
            }
            resolve(processedData)
          }
        }
      }, error => {
        reject(JSON.stringify(error))
      })
    })
  }

  // fetch patientID and config version from local storage
  // include other items when required
  // the values in response are in the same order as the promises
  // local storage service get() returns a promise always

  fetchFromStorage() {

    const configVersion = this.storage.get(StorageKeys.CONFIG_VERSION)
    const participantLogin = this.storage.get(StorageKeys.PARTICIPANTLOGIN)

    return Promise.all([configVersion, participantLogin]) // response are obtained by the order of promises
  }

}
