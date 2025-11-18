import { Injectable } from '@angular/core'

import { ConfigService } from '../../../../core/services/config/config.service'
import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { SchemaType } from '../../../../shared/models/kafka'
import { QuestionnaireProcessorService } from './questionnaire-processor.service'
import { NotificationService } from 'src/app/core/services/notifications/notification.service'

@Injectable({
  providedIn: 'root'
})
export class DefaultQuestionnaireProcessorService extends QuestionnaireProcessorService {
  constructor(
    schedule: ScheduleService,
    kafka: KafkaService,
    notifications: NotificationService
  ) {
    super(schedule, kafka, notifications)
  }

  process(data, task, assessmentMetadata) {
    const type = SchemaType.ASSESSMENT
    return Promise.all([
      this.updateTaskToComplete(task),
      !task.isDemo
        ? this.kafka.prepareKafkaObjectAndStore(type, {
          task,
          data,
          metadata: assessmentMetadata
        })
        : [],
      this.kafka
        .prepareKafkaObjectAndStore(SchemaType.TIMEZONE, {})
        .then(() => this.kafka.sendAllFromCache())
    ])
  }
}