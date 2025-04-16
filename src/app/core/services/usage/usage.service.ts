import { Injectable } from '@angular/core'

import { UsageEventType } from '../../../shared/enums/events'
import { SchemaType } from '../../../shared/models/kafka'
import { Task } from '../../../shared/models/task'
import { KafkaService } from '../kafka/kafka.service'
import { LogService } from '../misc/log.service'
import { AnalyticsService } from './analytics.service'

@Injectable({
  providedIn: 'root'
})
export class UsageService {
  constructor(
    private kafka: KafkaService,
    private analytics: AnalyticsService,
    private logger: LogService
  ) {}

  sendEventToKafka(payload) {
    return this.kafka
      .prepareKafkaObjectAndStore(SchemaType.APP_EVENT, payload)
      .then((res: any) => this.logger.log('usage service', 'send success'))
      .catch((error: any) => this.logger.error('usage service', error))
  }

  sendOpenEvent() {
    return this.sendEventToKafka({
      eventType: UsageEventType.APP_OPEN
    })
  }

  sendQuestionnaireEvent(
    type,
    taskName: string,
    taskTimestamp: number,
    metadata?: Map<string, string>
  ) {
    // noinspection JSIgnoredPromiseFromCall
    this.analytics.logEvent(type, {
      questionnaire_timestamp: taskTimestamp
        ? String(taskTimestamp)
        : Date.now(),
      questionnaire_name: taskName
    })
    return this.sendEventToKafka({
      eventType: type,
      questionnaireName: taskName,
      metadata: metadata
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
    return this.kafka.prepareKafkaObjectAndStore(SchemaType.COMPLETION_LOG, {
      name: task.name,
      percentage: percent,
      timeNotification: task.timestamp
    })
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
