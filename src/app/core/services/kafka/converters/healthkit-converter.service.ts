import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import {
  HealthKitDataTypeKey,
  HealthkitDataType,
  HealthkitStringDataType
} from 'src/app/shared/models/health'
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
    let processedData = {}
    Object.entries(answers).forEach(([k, v]) => {
      if (v && v instanceof Array) {
        processedData[k] = this.processSingleDatatype(
          k,
          v,
          payload.data.timeCompleted
        )
      }
    })
    return processedData
  }

  processSingleDatatype(key, data, timeReceived) {
    const type = this.getDataTypeFromKey(key)
    const results = data.map(d =>
      Object.assign(
        {},
        {
          time: getSeconds({ milliseconds: new Date(d.startDate).getTime() }),
          endTime: getSeconds({ milliseconds: new Date(d.endDate).getTime() }),
          timeReceived: timeReceived,
          sourceId: d.sourceBundleId,
          sourceName: d.sourceName,
          unit: d.unit,
          key,
          intValue: null,
          floatValue: null,
          doubleValue: null,
          stringValue: null
        },
        { [type]: d.value }
      )
    )
    return results
  }

  getDataTypeFromKey(key) {
    if (
      Object.values(HealthkitStringDataType).includes(
        key as HealthkitStringDataType
      )
    ) {
      return HealthKitDataTypeKey.STRING
    } else return HealthKitDataTypeKey.FLOAT
  }

  getKafkaTopic(payload, topics): Promise<any> {
    const key = payload.key
    return Promise.resolve('active_apple_healthkit_' + key)
  }
}
