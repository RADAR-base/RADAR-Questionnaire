import { Injectable } from '@angular/core'
import { WebIntent } from '@ionic-native/web-intent'

import {
  KAFKA_COMPLETION_LOG,
  KAFKA_USAGE
} from '../../../../assets/data/defaultConfig'
import { UsageEventType } from '../../../shared/models/usage-event'
import { KafkaService } from './kafka.service'

@Injectable()
export class UsageService {
  constructor(private webIntent: WebIntent, private kafka: KafkaService) {}

  sendOpen() {
    return this.webIntent.getIntent().then(intent =>
      this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
        eventType: intent.extras
          ? UsageEventType.APP_OPEN_DIRECTLY
          : UsageEventType.APP_OPEN_DIRECTLY
      })
    )
  }

  sendQuestionnaireStart() {
    return this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
      eventType: UsageEventType.QUESTIONNAIRE_STARTED
    })
  }

  sendQuestionnaireCompleted() {
    return this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
      eventType: UsageEventType.QUESTIONNAIRE_COMPLETED
    })
  }

  sendQuestionnaireClosed() {
    return this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
      eventType: UsageEventType.QUESTIONNARE_CLOSED
    })
  }

  sendCompletionLog(task, percent) {
    return this.kafka.prepareKafkaObjectAndSend(KAFKA_COMPLETION_LOG, {
      name: task.name,
      percentage: percent,
      timeNotification: task.timestamp
    })
  }
}
