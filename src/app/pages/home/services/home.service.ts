import { Injectable } from '@angular/core'
import { UsageService } from '../../../core/services/usage/usage.service'
import { UsageEventType } from '../../../shared/enums/events'

@Injectable()
export class HomeService {
  constructor(private usage: UsageService) {}

  sendOpenEvent() {
    this.usage.sendOpenEvent()
  }

  sendStartEvent(task) {
    this.usage.sendQuestionnaireEvent(
      UsageEventType.QUESTIONNAIRE_STARTED,
      task
    )
  }
}
