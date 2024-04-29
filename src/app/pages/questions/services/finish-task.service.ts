import { Injectable } from '@angular/core'

import { ConfigService } from '../../../core/services/config/config.service'
import { KafkaService } from '../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../shared/models/assessment'
import { SchemaType } from '../../../shared/models/kafka'

@Injectable({
  providedIn: 'root'
})
export class FinishTaskService {
  constructor(
    private schedule: ScheduleService,
    private kafka: KafkaService,
    private config: ConfigService
  ) {}

  getProgress() {
    return this.kafka.eventCallback$
  }

  processCompletedQuestionnaire(data, task, assessmentMetadata) {
    const type = task.name.toLowerCase().includes('health')
      ? SchemaType.HEALTHKIT
      : SchemaType.ASSESSMENT
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
        .then(() => this.kafka.sendAllFromCache()),
      this.cancelNotificationsForCompletedTask(task)
    ])
  }

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

  createClinicalFollowUpTask(assessment): Promise<any> {
    return this.schedule
      .generateSingleAssessmentTask(
        assessment,
        AssessmentType.CLINICAL,
        Date.now()
      )
      .then(() => this.config.rescheduleNotifications())
  }

  cancelNotificationsForCompletedTask(task): Promise<any> {
    console.log('Cancelling pending reminders for task..')
    const notifications = task.notifications ? task.notifications : []
    return notifications.forEach(n => this.config.cancelSingleNotification(n))
  }
}
