import { Injectable } from '@angular/core'

import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { Task } from '../../../shared/models/task'

@Injectable()
export class FinishTaskService {
  constructor(private schedule: SchedulingService) {}

  updateTaskToComplete(task): Promise<any> {
    const updatedTask = task
    updatedTask.completed = true
    return this.schedule.insertTask(updatedTask)
  }
}
