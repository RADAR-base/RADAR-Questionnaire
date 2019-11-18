import { Injectable } from '@angular/core'
import { WebIntent } from '@ionic-native/web-intent/ngx'

import { UsageEventType } from '../../../shared/enums/events'
import { SchemaType } from '../../../shared/models/kafka'
import { Task } from '../../../shared/models/task'
import { KafkaService } from '../kafka/kafka.service'
import { LogService } from '../misc/log.service'
import { AnalyticsService } from './analytics.service'

@Injectable()
export class UsageService {
  constructor(
    private webIntent: WebIntent,
    private kafka: KafkaService,
    private analytics: AnalyticsService,
    private logger: LogService
  ) {}

  sendEventToKafka(payload) {
    return this.kafka
      .prepareKafkaObjectAndSend(SchemaType.APP_EVENT, payload, true)
      .then((res: any) => this.logger.log('usage service', 'send success'))
      .catch((error: any) => this.logger.error('usage service', error))
  }

  sendOpenEvent() {
    return this.webIntent.getIntent().then(intent => {
      this.logger.log(intent)
      return this.sendEventToKafka({
        eventType:
          Object.keys(intent.extras).length > 1
            ? UsageEventType.NOTIFICATION_OPEN
            : UsageEventType.APP_OPEN
      })
    })
  }

  sendQuestionnaireEvent(type, task: Task) {
    // noinspection JSIgnoredPromiseFromCall
    this.analytics.logEvent(type, {
      questionnaire_timestamp: task.timestamp
        ? String(task.timestamp)
        : Date.now(),
      questionnaire_name: task.name
    })
    return this.sendEventToKafka({
      eventType: type,
      questionnaireName: task.name
    })
  }

  sendGeneralEvent(type, sendToKafka?, payload?) {
    // noinspection JSIgnoredPromiseFromCall
    this.analytics.logEvent(type, payload ? payload : {})
    if (sendToKafka)
      return this.sendEventToKafka({
        eventType: type
      })
  }

  sendClickEvent(button) {
    // noinspection JSIgnoredPromiseFromCall
    this.analytics.logEvent(UsageEventType.CLICK, { button: button })
  }

  sendCompletionLog(task, percent) {
    return this.kafka.prepareKafkaObjectAndSend(
      SchemaType.COMPLETION_LOG,
      {
        name: task.name,
        percentage: percent,
        timeNotification: task.timestamp
      },
      true
    )
  }

  setPage(component) {
    // Note: This converts QuestionsPageComponent to questions-page
    let page = component.split(/(?=[A-Z])/)
    page.pop()
    page = page.join('-').toLowerCase()
    if (!page.includes('page')) page = page + '-page'
    // noinspection JSIgnoredPromiseFromCall
    this.analytics.setCurrentScreen(page)
  }
}
