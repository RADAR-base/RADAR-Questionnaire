import { Injectable } from '@angular/core'

import { DefaultNumberOfNotificationsToSchedule } from '../../../../assets/data/defaultConfig'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'

@Injectable()
export class FinishTaskService {
  constructor(
    private schedule: SchedulingService,
    private notifications: NotificationService
  ) {}

  updateTaskToComplete(task): Promise<any> {
    const updatedTask = task
    updatedTask.completed = true
    updatedTask.timeCompleted = new Date().getTime()
    if (updatedTask.isClinical == false)
      this.schedule.addToCompletedTasks(updatedTask)
    return this.schedule.insertTask(updatedTask)
  }

  updateTaskToReportedCompletion(task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }

  scheduleClinicalTasks(task) {
    return this.schedule
      .generateClinicalTasks(task)
      .then(() =>
        this.notifications.setNextXNotifications(
          DefaultNumberOfNotificationsToSchedule
        )
      )
  }
}
