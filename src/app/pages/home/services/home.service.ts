import { Injectable } from '@angular/core'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { UsageService } from '../../../core/services/usage/usage.service'

@Injectable()
export class HomeService {
  constructor(private kafka: KafkaService, private usage: UsageService) {}

  sendOpenEvent() {
    this.usage.sendOpen()
  }

  sendStartEvent(task) {
    this.usage.sendQuestionnaireStart(task)
  }

  emptyCache() {
    this.kafka.sendToKafkaFromCache()
  }
}
