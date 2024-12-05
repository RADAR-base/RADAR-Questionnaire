import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { EventValueExport } from 'src/app/shared/models/event'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'
import { Utility } from 'src/app/shared/utilities/util'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'
import { RemoteConfigService } from '../../config/remote-config.service'

@Injectable()
export class AppEventConverterService extends ConverterService {
  constructor(
    logger: LogService,
    http: HttpClient,
    token: TokenService,
    private utility: Utility,
    remoteConfig: RemoteConfigService
  ) {
    super(logger, http, token, remoteConfig)
  }

  init() { }

  getKafkaTopic(payload): Promise<any> {
    return Promise.resolve('questionnaire_app_event')
  }

  processData(payload) {
    const Event: EventValueExport = {
      time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
      eventType: payload.eventType.toUpperCase(),
      questionnaireName: payload.questionnaireName,
      metadata: this.utility.mapToObject(payload.metadata)
    }
    return Event
  }
}
