import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { CompletionLogValueExport } from 'src/app/shared/models/completion-log'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'

@Injectable()
export class CompletionLogConverterService extends ConverterService {
  constructor(logger: LogService, http: HttpClient, token: TokenService) {
    super(logger, http, token)
  }

  init() {}

  getKafkaTopic(payload): Promise<any> {
    return Promise.resolve('questionnaire_completion_log')
  }

  processData(payload) {
    const CompletionLog: CompletionLogValueExport = {
      name: payload.name,
      time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
      timeNotification: getSeconds({
        milliseconds: payload.timeNotification
      }),
      completionPercentage: payload.percentage
    }
    return CompletionLog
  }
}
