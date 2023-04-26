import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { HealthkitDataType } from 'src/app/shared/models/health'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'

@Injectable()
export class HealthkitConverterService extends ConverterService {
  GENERAL_TOPIC: string = 'questionnaire_response'

  HEALTHKIT_KEYS: Set<HealthkitDataType> = new Set([
    HealthkitDataType.ACTIVITY,
    HealthkitDataType.APPLE_EXERCISE_TIME,
    HealthkitDataType.CALORIES,
    HealthkitDataType.DISTANCE,
    HealthkitDataType.STAIRS,
    HealthkitDataType.VO2MAX
  ])

  constructor(logger: LogService, http: HttpClient, token: TokenService) {
    super(logger, http, token)
  }

  init() {}

  processData(payload) {
    const answers = payload.data.answers
    Object.entries(answers).forEach(([k, v]) => {
      if (v && v instanceof Array) {
        const processedData = this.processSingleDatatype(
          k,
          v,
          payload.data.timeCompleted
        )
        console.log(processedData)
      }
    })

    return {}
  }

  processSingleDatatype(key, data, timeReceived) {
    const results = data.map(d => {
      return {
        startTime: new Date(d.startDate).getTime(),
        endTime: new Date(d.endDate).getTime(),
        timeReceived,
        [key]: d.value
      }
    })
    return results
  }

  getKafkaTopic(payload, topics): Promise<any> {
    return Promise.resolve('healthkit_steps')
  }
}
