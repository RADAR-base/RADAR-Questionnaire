import { Injectable } from '@angular/core'

import { ConfigService } from '../../../core/services/config/config.service'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { NotificationService } from '../../../core/services/notifications/notification.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { SchemaType } from '../../../shared/models/kafka'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'
import { PrepareDataService } from './prepare-data.service'

@Injectable()
export class FinishTaskService {
  constructor(
    private schedule: ScheduleService,
    private usage: UsageService,
    private prepare: PrepareDataService,
    private kafka: KafkaService,
    private notifications: NotificationService,
    private config: ConfigService
  ) {}

  updateTaskToComplete(task) {
    return getTaskType(task) == TaskType.NON_CLINICAL
      ? Promise.all([
          this.schedule.updateTaskToComplete(task),
          this.schedule.updateTaskToReportedCompletion(task),
          this.schedule.addToCompletedTasks(task)
        ])
      : Promise.resolve([])
  }

  sendCompletedEvent() {
    return this.usage.sendQuestionnaireCompleted()
  }

  processDataAndSend(data, task) {
    return this.config.getConfigVersion().then(version => {
      this.sendAnswersToKafka(
        this.prepare.processQuestionnaireData(data, version),
        task
      )
    })
  }

  sendAnswersToKafka(processedAnswers, task) {
    // NOTE: Submit data to kafka
    return Promise.all([
      this.kafka.prepareKafkaObjectAndSend(SchemaType.TIMEZONE, {}),
      this.kafka.prepareKafkaObjectAndSend(SchemaType.ASSESSMENT, {
        task: task,
        data: processedAnswers
      })
    ])
  }

  evalClinicalFollowUpTask(assessment): Promise<any> {
    return this.config
      .getReferenceDate()
      .then(date => this.schedule.generateClinicalSchedule(assessment, date))
      .then(() => this.notifications.publish())
  }
}
