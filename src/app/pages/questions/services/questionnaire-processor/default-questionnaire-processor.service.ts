import { Injectable } from '@angular/core'

import { ConfigService } from '../../../../core/services/config/config.service'
import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { SchemaType } from '../../../../shared/models/kafka'
import { QuestionnaireProcessorService } from './questionnaire-processor.service'

@Injectable({
  providedIn: 'root'
})
export class DefaultQuestionnaireProcessorService extends QuestionnaireProcessorService {
  constructor(
    schedule: ScheduleService,
    kafka: KafkaService,
  ) {
    super(schedule, kafka)
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