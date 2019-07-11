import { Injectable } from '@angular/core'
import { UsageEventType } from '../../../shared/enums/events'
import { UsageService } from '../../../core/services/usage/usage.service'

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
