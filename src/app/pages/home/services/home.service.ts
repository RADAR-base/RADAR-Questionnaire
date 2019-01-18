import { Injectable } from '@angular/core'

import { KAFKA_COMPLETION_LOG } from '../../../../assets/data/defaultConfig'
import { KafkaService } from '../../../core/services/kafka.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { UsageService } from '../../../core/services/usage.service'
import { Task, TasksProgress } from '../../../shared/models/task'
import { getSeconds } from '../../../shared/utilities/time'
import { TasksService } from './tasks.service'

@Injectable()
export class HomeService {
  constructor(
    private schedule: SchedulingService,
    private kafka: KafkaService,
    private usage: UsageService
  ) {}

  sendOpenEvent() {
    this.usage.sendOpen(getSeconds({ milliseconds: new Date().getTime() }))
  }

  sendStartEvent() {
    this.usage.sendQuestionnaireStart(
      getSeconds({ milliseconds: new Date().getTime() })
    )
  }

  emptyCache() {
    this.kafka.sendToKafkaFromCache()
  }

  sendCompetionLogs() {
    this.schedule.getNonReportedCompletedTasks().then(nonReportedTasks => {
      nonReportedTasks.forEach(t => {
        this.kafka.prepareKafkaObjectAndSend(KAFKA_COMPLETION_LOG, {
          task: t
        })
        this.schedule.updateTaskToReportedCompletion(t)
      })
    })
  }
}
