import { Injectable } from '@angular/core'
import { WebIntent } from '@ionic-native/web-intent/ngx'

import { SchemaType } from '../../../shared/models/kafka'
import { UsageEventType } from '../../../shared/models/usage-event'
import { KafkaService } from '../kafka/kafka.service'

@Injectable()
export class UsageService {
  constructor(private webIntent: WebIntent, private kafka: KafkaService) {}

  sendUsageEvent(payload) {
    return this.kafka.prepareKafkaObjectAndSend(SchemaType.USAGE, payload)
  }
  sendOpen() {
    return this.webIntent.getIntent().then(intent =>
      this.sendUsageEvent({
        eventType: intent.extras
          ? UsageEventType.APP_OPEN_NOTIFICATION
          : UsageEventType.APP_OPEN_DIRECTLY
      })
    )
  }

  sendQuestionnaireStart() {
    return this.sendUsageEvent({
      eventType: UsageEventType.QUESTIONNAIRE_STARTED
    })
  }

  sendQuestionnaireCompleted() {
    return this.sendUsageEvent({
      eventType: UsageEventType.QUESTIONNAIRE_COMPLETED
    })
  }

  sendQuestionnaireClosed() {
    return this.sendUsageEvent({
      eventType: UsageEventType.QUESTIONNARE_CLOSED
    })
  }

  sendCompletionLog(task, percent) {
    return this.kafka.prepareKafkaObjectAndSend(SchemaType.COMPLETION_LOG, {
      name: task.name,
      percentage: percent,
      timeNotification: task.timestamp
    })
  }
}
