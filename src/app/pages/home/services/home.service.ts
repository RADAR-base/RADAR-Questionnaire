import { Injectable } from '@angular/core'
import { UsageService } from '../../../core/services/usage/usage.service'

@Injectable()
export class HomeService {
  constructor(private usage: UsageService) {}

  sendOpenEvent() {
    this.usage.sendOpen()
  }

  sendStartEvent(task) {
    this.usage.sendQuestionnaireStart(task)
  }
}
