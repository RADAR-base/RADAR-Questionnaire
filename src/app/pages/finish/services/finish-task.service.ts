import { Injectable } from '@angular/core'

import { TaskType, getTaskType } from '../../../shared/utilities/task-type'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { PrepareDataService } from './prepare-data.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { SchemaType } from '../../../shared/models/kafka'
import { UsageEventType } from '../../../shared/enums/events'
import { UsageService } from '../../../core/services/usage/usage.service'

@Injectable()
export class FinishTaskService {
  constructor(
    private schedule: ScheduleService,
    private usage: UsageService,
    private prepare: PrepareDataService,
    private kafka: KafkaService
  ) {}

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule.updateTaskToComplete(task),
      this.schedule.updateTaskToReportedCompletion(task),
      getTaskType(task) == TaskType.NON_CLINICAL
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  sendFinishedEvent(task) {
    return this.usage.sendQuestionnaireEvent(
      UsageEventType.QUESTIONNAIRE_FINISHED,
      task
    )
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
    return this.schedule.generateClinicalSchedule(assessment, Date.now())
    // TODO: Fix notification scheduling right after generating clinic schedule
  }
}
