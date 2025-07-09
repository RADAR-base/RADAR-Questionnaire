import { Injectable } from '@angular/core'

import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'

@Injectable({
  providedIn: 'root'
})
export abstract class QuestionnaireProcessorService {
  constructor(
    private schedule: ScheduleService,
    public kafka: KafkaService,
  ) { }

  process(data, task, assessmentMetadata) { }

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule
        .updateTaskToComplete(task)
        .then(res => this.schedule.updateTaskToReportedCompletion(task)),
      task.type == AssessmentType.SCHEDULED
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  getProgress() {
    return this.kafka.eventCallback$
  }

  resetProgress() {
    this.kafka.resetProgress()
  }
}
