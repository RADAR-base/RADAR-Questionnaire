import { Injectable } from '@angular/core'

import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { NotificationService } from '../../../../core/services/notifications/notification.service'
import { NotificationActionType } from 'src/app/shared/models/notification-handler'

@Injectable({
  providedIn: 'root'
})
export abstract class QuestionnaireProcessorService {
  constructor(
    private schedule: ScheduleService,
    public kafka: KafkaService,
    protected notifications: NotificationService
  ) { }

  process(data, task, assessmentMetadata) { }

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule
        .updateTaskToComplete(task)
        .then(res => this.schedule.updateTaskToReportedCompletion(task))
        .then(res => this.cancelRemindersForTask(task)),
      task.type == AssessmentType.SCHEDULED
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  cancelRemindersForTask(task): Promise<any> {
    console.log('cancelRemindersForTask', task)
    const notifications = task.notifications
    return Promise.all(notifications.map(n => {
      if (n.id) {
        return this.notifications.publish(NotificationActionType.CANCEL_SINGLE, 0, n.id)
          .then(() => n.id = undefined)
      } else return
    }))
  }
}
