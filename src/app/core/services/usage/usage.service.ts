import { FirebaseAnalyticsService } from './firebaseAnalytics.service'
import { Injectable } from '@angular/core'
import { KafkaService } from '../kafka/kafka.service'
import { SchemaType } from '../../../shared/models/kafka'
import { UsageEventType } from '../../../shared/models/usage-event'
import { WebIntent } from '@ionic-native/web-intent/ngx'

@Injectable()
export class UsageService {
  constructor(
    private webIntent: WebIntent,
    private kafka: KafkaService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {}

  sendUsageEvent(payload) {
    return this.kafka.prepareKafkaObjectAndSend(SchemaType.USAGE, payload, true)
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

  sendQuestionnaireStart(task) {
    this.firebaseAnalytics.logEvent('questionnaire_started', {
      questionnaire_timestamp: String(task.timestamp),
      type: task.name
    })
    return this.sendUsageEvent({
      eventType: UsageEventType.QUESTIONNAIRE_STARTED
    })
  }

  sendQuestionnaireCompleted(task) {
    this.firebaseAnalytics.logEvent('questionnaire_finished', {
      questionnaire_timestamp: String(task.timestamp),
      type: task.name
    })
    return this.sendUsageEvent({
      eventType: UsageEventType.QUESTIONNAIRE_COMPLETED
    })
  }

  sendQuestionnaireClosed() {
    return this.sendUsageEvent({
      eventType: UsageEventType.QUESTIONNARE_CLOSED
    })
  }

  sendConfigChangeEvent(type, prevVer?, newVer?) {
    this.firebaseAnalytics.logEvent(type, {
      prev_version: String(prevVer),
      new_version: String(newVer)
    })
  }

  sendKafkaEvent(type, name, time, error?) {
    this.firebaseAnalytics.logEvent(type, {
      name: name,
      questionnaire_timestamp: String(time),
      error: JSON.stringify(error)
    })
  }

  sendClick(button) {
    this.firebaseAnalytics.logEvent('click', { button: button })
  }

  sendCompletionLog(task, percent) {
    const keepInCache = percent == 0
    return this.kafka.prepareKafkaObjectAndSend(
      SchemaType.COMPLETION_LOG,
      {
        name: task.name,
        percentage: percent,
        timeNotification: task.timestamp
      },
      keepInCache
    )
  }
}
