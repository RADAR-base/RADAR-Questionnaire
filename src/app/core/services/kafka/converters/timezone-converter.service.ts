import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { QuestionType } from 'src/app/shared/models/question'
import { ApplicationTimeZoneValueExport } from 'src/app/shared/models/timezone'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'

@Injectable()
export class TimezoneConverterService extends ConverterService {
  constructor(logger: LogService, http: HttpClient, token: TokenService) {
    super(logger, http, token)
  }

  init() {}

  getKafkaTopic(payload): Promise<any> {
    return Promise.resolve('questionnaire_timezone')
  }

  processData(payload) {
    const ApplicationTimeZone: ApplicationTimeZoneValueExport = {
      time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
      offset: getSeconds({ minutes: new Date().getTimezoneOffset() })
    }
    return ApplicationTimeZone
  }
}
