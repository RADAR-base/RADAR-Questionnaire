import { Injectable } from '@angular/core'

import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'

@Injectable({
  providedIn: 'root'
})
export class TaskStreakService {
  constructor(private schedule: ScheduleService) {}

  private isTaskExpired(task: Task) {
    // NOTE: This checks if completion window has passed or task is complete
    return (
      task.timestamp + task.completionWindow < new Date().getTime() ||
      task.completed
    )
  }

  private isTaskStartable(task: Task) {
    // NOTE: This checks if the task timestamp has passed and if task is valid
    return task.timestamp <= new Date().getTime() && !this.isTaskExpired(task)
  }

  private areAllTasksComplete(tasks: Task[]) {
    return !tasks || tasks.every(t => t.completed || !this.isTaskStartable(t))
  }

  async getStreakDays(): Promise<number> {
    // A "streak day" is counted only if:
    // 1) At least one task was completed on that calendar day
    // 2) All startable tasks scheduled for that day are completed
    // Days are based on LOCAL midnight boundaries (12am → new day).

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedTasks = await this.schedule.getCompletedTasks()

    // Map of "day at local midnight (epoch ms)" -> at least one task completed that day
    const completedDays = new Set<number>()
    completedTasks.forEach(task => {
      const date = new Date(task.timeCompleted)
      date.setHours(0, 0, 0, 0)
      completedDays.add(date.getTime())
    })

    let streak = 0
    let currentDate = new Date(today.getTime())

    // Walk backwards day by day from today.
    // - Days with no scheduled tasks are skipped (do not break the streak).
    // - Days with tasks but no completions, or with incomplete startable tasks, break the streak.
    // Each loop iteration represents a new calendar day starting at 12am.
    const MAX_DAYS_LOOKBACK = 365

    for (let i = 0; i < MAX_DAYS_LOOKBACK; i++) {
      const dayTasks = await this.schedule.getTasksForDate(
        new Date(currentDate.getTime()),
        AssessmentType.SCHEDULED
      )

      // If there are no scheduled tasks this day, skip it without affecting streak.
      if (!Array.isArray(dayTasks) || dayTasks.length === 0) {
        currentDate.setDate(currentDate.getDate() - 1)
        continue
      }

      const dayKey = currentDate.getTime()

      // If there are scheduled tasks but none completed that day, streak ends.
      if (!completedDays.has(dayKey)) break

      // If not all startable tasks are complete, streak ends.
      if (!this.areAllTasksComplete(dayTasks)) break

      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }
}


