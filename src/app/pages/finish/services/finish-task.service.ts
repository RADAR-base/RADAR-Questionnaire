import { Injectable } from '@angular/core'

import { ConfigService } from '../../../core/services/config/config.service'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { SchemaType } from '../../../shared/models/kafka'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'
import { PrepareDataService } from './prepare-data.service'

@Injectable()
export class FinishTaskService {
  constructor(
    private schedule: ScheduleService,
    private prepare: PrepareDataService,
    private kafka: KafkaService,
    private config: ConfigService
  ) {}

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule.updateTaskToComplete(task),
      this.schedule.updateTaskToReportedCompletion(task),
      getTaskType(task) == TaskType.NON_CLINICAL
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve(),
      this.config.rescheduleNotifications(true)
    ])
  }

  processDataAndSend(data, task) {
    return this.sendAnswersToKafka(
      this.prepare.processQuestionnaireData(data),
      task
    )
  }

  sendAnswersToKafka(processedAnswers, task): Promise<any> {
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
    console.log('evaluating')
    return this.schedule
      .generateClinicalSchedule(assessment, Date.now())
      .then(() => this.config.rescheduleNotifications())
  }
}
