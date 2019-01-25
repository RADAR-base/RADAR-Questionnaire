import { Injectable } from '@angular/core'

import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { UsageService } from '../../../core/services/kafka/usage.service'
import { TasksService } from './tasks.service'

@Injectable()
export class HomeService {
  constructor(
    private kafka: KafkaService,
    private usage: UsageService,
    private tasks: TasksService
  ) {}

  sendOpenEvent() {
    this.usage.sendOpen()
  }

  sendStartEvent() {
    this.usage.sendQuestionnaireStart()
  }

  emptyCache() {
    this.kafka.sendToKafkaFromCache()
  }

  sendNonReportedCompletionLogs() {
    this.tasks.getIncompleteTasks().then(tasks =>
      tasks.map(task => {
        this.usage
          .sendCompletionLog(task, 0)
          .then(() => this.tasks.updateTaskToReportedCompletion(task))
      })
    )
  }
}
