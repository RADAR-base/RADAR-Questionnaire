import { Injectable } from '@angular/core'

import { ConfigService } from '../../../../core/services/config/config.service'
import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { SchemaType } from '../../../../shared/models/kafka'
import { QuestionnaireProcessorService } from './questionnaire-processor.service'
import { NotificationService } from 'src/app/core/services/notifications/notification.service'
import { TemplateRendererService } from 'src/app/core/services/misc/template-renderer.service'

@Injectable({
  providedIn: 'root'
})
export class DefaultQuestionnaireProcessorService extends QuestionnaireProcessorService {
  constructor(
    schedule: ScheduleService,
    kafka: KafkaService,
    notifications: NotificationService,
    templateRenderer: TemplateRendererService
  ) {
    super(schedule, kafka, notifications, templateRenderer)
  }

  async process(data, task, assessmentMetadata, protocolMetaData?) {
    const kafkaMetadata = await this.addAssessmentDisplayNameToMetadata(
      task,
      assessmentMetadata,
      protocolMetaData
    )
    const type = SchemaType.ASSESSMENT
    return Promise.all([
      this.updateTaskToComplete(task),
      !task.isDemo
        ? this.kafka.prepareKafkaObjectAndStore(type, {
          task,
          data,
          metadata: kafkaMetadata
        })
        : [],
      this.kafka
        .prepareKafkaObjectAndStore(SchemaType.TIMEZONE, {})
        .then(() => this.kafka.sendAllFromCache())
    ])
  }
}