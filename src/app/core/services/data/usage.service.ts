import { Injectable } from '@angular/core'
import { WebIntent } from '@ionic-native/web-intent'

import {
  DefaultPackageName,
  KAFKA_USAGE
} from '../../../../assets/data/defaultConfig'
import { UsageEventType } from '../../../shared/models/usage-event'
import { KafkaService } from './kafka.service'

@Injectable()
export class UsageService {
  constructor(private webIntent: WebIntent, private kafka: KafkaService) {}

  sendOpen(time) {
    return this.webIntent.getIntent().then(intent => {
      const packageName = intent.package ? intent.package : DefaultPackageName
      const categoryName = intent.categories
      const type = intent.extras
        ? UsageEventType.APP_OPEN_DIRECTLY
        : UsageEventType.APP_OPEN_DIRECTLY
      return this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
        time: time,
        eventType: type,
        packageName: packageName,
        categoryName: categoryName
      })
    })
  }

  sendQuestionnaireStart(time) {
    return this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
      time: time,
      eventType: UsageEventType.QUESTIONNAIRE_STARTED,
      packageName: DefaultPackageName
    })
  }

  sendQuestionnaireCompleted(time) {
    return this.kafka.prepareKafkaObjectAndSend(KAFKA_USAGE, {
      time: time,
      eventType: UsageEventType.QUESTIONNAIRE_COMPLETED,
      packageName: DefaultPackageName
    })
  }
}
