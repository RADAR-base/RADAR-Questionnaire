import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { Task, TasksProgress } from '../../../shared/models/task'

@Injectable()
export class TasksService {
  constructor(
    public storage: StorageService,
    private schedule: SchedulingService
  ) {}

  getAssessment(task) {
    return this.storage.getAssessment(task)
  }

  getNonClinicalTasksOfToday() {
    return this.schedule
      .getNonClinicalTasksForDate(new Date())
      .then(tasks =>
        tasks.filter(
          t =>
            this.isTaskValid(t) ||
            (t.completed && this.isToday(t.timeCompleted))
        )
      )
  }

  getSortedNonClinicalTasksOfToday(): Promise<Map<number, Task[]>> {
    return this.getNonClinicalTasksOfToday().then(tasks => {
      const sortedTasks = new Map()
      tasks.forEach(t => {
        const midnight = this.schedule
          .setDateTimeToMidnight(t.timestamp)
          .getTime()
        if (sortedTasks.has(midnight)) sortedTasks.get(midnight).push(t)
        else sortedTasks.set(midnight, [t])
      })
      return sortedTasks
    })
  }

  getTasksOfDate(timestamp) {
    return this.schedule.getNonClinicalTasksForDate(timestamp)
  }

  getTaskProgress(): Promise<TasksProgress> {
    return this.getNonClinicalTasksOfToday().then(tasks => {
      return {
        numberOfTasks: tasks.length,
        completedTasks: tasks.filter(d => d.completed).length
      }
    })
  }

  isToday(date) {
    return (
      new Date(date).setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0)
    )
  }

  areAllTasksComplete(tasks) {
    return !tasks || tasks.every(t => t.completed || !this.isTaskStartable(t))
  }

  isLastTask(task, tasks) {
    return !tasks || tasks.every(t => t.completed || t.index === task.index)
  }

  isTaskStartable(task) {
    // NOTE: This checks if the task timestamp has passed and if task is valid
    return task.timestamp <= new Date().getTime() && this.isTaskValid(task)
  }

  isTaskValid(task) {
    // NOTE: This checks if completion window has not passed and task is incomplete
    return (
      task.timestamp + task.completionWindow > new Date().getTime() &&
      !task.completed
    )
  }

  /**
   * This function Retrieves the most current next task from a list of tasks.
   * @param tasks : list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  getNextTask(tasks: Task[]): Task | undefined {
    if (tasks) {
      return tasks.find(task => this.isTaskValid(task))
    }
  }

  getCurrentDateMidnight() {
    return this.schedule.setDateTimeToMidnight(new Date())
  }
}
