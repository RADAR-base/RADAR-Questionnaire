import { Injectable } from '@angular/core'

import { RemoteConfigService } from '../../../core/services/config/remote-config.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { DefaultStreakRequireAllTasks } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { AssessmentType } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'

export enum StreakMode {
  AT_LEAST_ONE = 'at_least_one',
  ALL_TASKS = 'all_tasks'
}

@Injectable({
  providedIn: 'root'
})
export class TaskStreakService {
  private readonly MAX_DAYS_LOOKBACK = 365

  constructor(
    private schedule: ScheduleService,
    private remoteConfig: RemoteConfigService
  ) { }

  /**
   * Get the configured streak mode from remote config
   */
  private async getStreakMode(): Promise<StreakMode> {
    const config = await this.remoteConfig.read()
    const requireAll = await config.getOrDefault(
      ConfigKeys.TASK_STREAK_REQUIRE_ALL_TASKS,
      DefaultStreakRequireAllTasks
    )
    return requireAll === 'true' ? StreakMode.ALL_TASKS : StreakMode.AT_LEAST_ONE
  }

  /**
   * Calculate the end of a given day (23:59:59.999)
   */
  private getDayEndTime(date: Date): number {
    const dayEnd = new Date(date.getTime())
    dayEnd.setHours(23, 59, 59, 999)
    return dayEnd.getTime()
  }

  /**
   * Check if a task's completion window expired by the reference time
   */
  private isTaskExpiredByTime(task: Task, referenceTime: number): boolean {
    return task.timestamp + task.completionWindow < referenceTime
  }

  /**
   * Check if a task was scheduled to start by end of day
   */
  private wasTaskScheduledByEndOfDay(task: Task, dayEndTime: number): boolean {
    return task.timestamp <= dayEndTime
  }

  /**
   * Get tasks that were available (startable) on this day
   * Includes both completed and incomplete tasks that were scheduled for the day
   * and had not expired (or were completed before expiring)
   */
  private getAvailableTasksForDay(tasks: Task[], dayEndTime: number): Task[] {
    return tasks.filter(task => {
      const wasScheduled = this.wasTaskScheduledByEndOfDay(task, dayEndTime)
      if (!wasScheduled) return false

      // If completed, it was available (regardless of expiry)
      if (task.completed) return true

      // If not completed, check if it's still not expired
      return !this.isTaskExpiredByTime(task, dayEndTime)
    })
  }

  /**
   * Get tasks that were completed and scheduled by end of day
   * These are the tasks that contribute positively to the streak
   */
  private getCompletedTasksForDay(tasks: Task[], dayEndTime: number): Task[] {
    return tasks.filter(task =>
      task.completed && this.wasTaskScheduledByEndOfDay(task, dayEndTime)
    )
  }

  /**
   * Calculate the current task completion streak
   */
  async getStreakDays(): Promise<number> {
    const mode = await this.getStreakMode()
    const today = this.getTodayAtMidnight()

    let streak = 0
    let currentDate = new Date(today.getTime())

    for (let i = 0; i < this.MAX_DAYS_LOOKBACK; i++) {
      const dayTasks = await this.getTasksForDay(currentDate)

      // Skip days with no scheduled tasks (doesn't break streak)
      if (!dayTasks || dayTasks.length === 0) {
        currentDate = this.getPreviousDay(currentDate)
        continue
      }

      const dayEndTime = this.getDayEndTime(currentDate)

      // Get tasks that were scheduled for this day
      const scheduledTasks = dayTasks.filter(task =>
        this.wasTaskScheduledByEndOfDay(task, dayEndTime)
      )

      // Skip days with no scheduled tasks (doesn't break or count toward streak)
      if (scheduledTasks.length === 0) {
        currentDate = this.getPreviousDay(currentDate)
        continue
      }

      // Get completed tasks for this day
      const completedTasks = this.getCompletedTasksForDay(dayTasks, dayEndTime)

      // Check if day qualifies based on mode (LENIENT: ignores incomplete tasks)
      let qualifies = false
      if (mode === StreakMode.ALL_TASKS) {
        // All scheduled tasks must be completed
        qualifies = completedTasks.length === scheduledTasks.length
      } else {
        // At least one scheduled task must be completed
        qualifies = completedTasks.length > 0
      }

      if (!qualifies) {
        break
      }

      streak++
      currentDate = this.getPreviousDay(currentDate)
    }

    return streak
  }

  /**
   * Get today's date at midnight
   */
  private getTodayAtMidnight(): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  /**
   * Get the previous day from a given date
   */
  private getPreviousDay(date: Date): Date {
    const previousDay = new Date(date.getTime())
    previousDay.setDate(previousDay.getDate() - 1)
    return previousDay
  }

  /**
   * Get scheduled tasks for a specific day
   */
  private async getTasksForDay(date: Date): Promise<Task[]> {
    return this.schedule.getTasksForDate(
      new Date(date.getTime()),
      AssessmentType.SCHEDULED
    )
  }
}


