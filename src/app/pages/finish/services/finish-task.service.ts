import { Injectable } from '@angular/core'

import {
  KAFKA_ASSESSMENT,
  KAFKA_TIMEZONE
} from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { UsageService } from '../../../core/services/kafka/usage.service'
import { NotificationService } from '../../../core/services/notifications/notification.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { PrepareDataService } from './prepare-data.service'

@Injectable()
export class FinishTaskService {
  constructor(
    private schedule: ScheduleService,
    private usage: UsageService,
    private prepare: PrepareDataService,
    private kafka: KafkaService,
    private notifications: NotificationService
  ) {}

  updateTaskToComplete(task) {
    this.schedule.updateTaskToComplete(task)
    this.schedule.updateTaskToReportedCompletion(task)
    if (task.isClinical == false) this.schedule.addToCompletedTasks(task)
  }

  sendCompletedEvent() {
    this.usage.sendQuestionnaireCompleted()
  }

  processDataAndSend(data, task) {
    return this.prepare.processQuestionnaireData(data).then(
      processedAnswers => {
        console.log(processedAnswers)
        return this.sendToKafka(processedAnswers, task)
      },
      error => {
        console.log(JSON.stringify(error))
      }
    )
  }

  sendToKafka(processedAnswers, task) {
    // NOTE: Submit data to kafka
    this.kafka.prepareKafkaObjectAndSend(KAFKA_TIMEZONE, {})
    this.kafka.prepareKafkaObjectAndSend(KAFKA_ASSESSMENT, {
      task: task,
      data: processedAnswers
    })
  }

  evalClinicalFollowUpTask(assessment): Promise<any> {
    return this.schedule
      .generateClinicalSchedule(assessment)
      .then(() => this.notifications.publish())
  }
}
