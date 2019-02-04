import { Injectable } from '@angular/core'

import { SchedulingService } from '../../../core/services/scheduling.service'

@Injectable()
export class FinishTaskService {
  constructor(private schedule: SchedulingService) {}

  updateTaskToComplete(task): Promise<any> {
    const updatedTask = task
    updatedTask.completed = true
    if (updatedTask.isClinical == false)
      this.schedule.addToCompletedTasks(updatedTask)
    return this.schedule.insertTask(updatedTask)
  }

  updateTaskToReportedCompletion(task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }
}
