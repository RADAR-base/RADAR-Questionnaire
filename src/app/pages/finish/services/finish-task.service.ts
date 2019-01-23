import { Injectable } from '@angular/core'

import {
  KAFKA_ASSESSMENT,
  KAFKA_COMPLETION_LOG,
  KAFKA_TIMEZONE
} from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { UsageService } from '../../../core/services/usage.service'
import { getSeconds } from '../../../shared/utilities/time'
import { PrepareDataService } from './prepare-data.service'

@Injectable()
export class FinishTaskService {
  constructor(
    private schedule: SchedulingService,
    private usage: UsageService,
    private prepare: PrepareDataService,
    private kafka: KafkaService,
    private notifications: NotificationService
  ) {}

  updateTaskToComplete(task) {
    this.schedule.updateTaskToComplete(task)
    this.schedule.updateTaskToReportedCompletion(task)
    if (!task.isClinical) this.schedule.addToCompletedTasks(task)
  }

  sendCompletedEvent() {
    this.usage.sendQuestionnaireCompleted(
      getSeconds({ milliseconds: new Date().getTime() })
    )
  }

  processDataAndSend(data, task) {
    return this.prepare.processQuestionnaireData(data).then(
      processedAnswers => {
        this.sendToKafka(processedAnswers, task)
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
