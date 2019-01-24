import { Injectable } from '@angular/core'

import { KafkaService } from '../../../core/services/data/kafka.service'
import { UsageService } from '../../../core/services/data/usage.service'
import { getSeconds } from '../../../shared/utilities/time'

@Injectable()
export class HomeService {
  constructor(private kafka: KafkaService, private usage: UsageService) {}

  sendOpenEvent() {
    this.usage.sendOpen(getSeconds({ milliseconds: new Date().getTime() }))
  }

  sendStartEvent() {
    this.usage.sendQuestionnaireStart(
      getSeconds({ milliseconds: new Date().getTime() })
    )
  }

  emptyCache() {
    this.kafka.sendToKafkaFromCache()
  }
}
