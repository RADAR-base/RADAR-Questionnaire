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

  getTasksOfToday() {
    return this.schedule.getNonClinicalTasksForDate(new Date())
  }

  getSortedTasksOfToday(): Promise<Map<number, Task[]>> {
    return this.getTasksOfToday().then(tasks => {
      const sortedTasks = new Map()
      tasks.forEach(t => {
        const midnight = new Date(t.timestamp).setUTCHours(0, 0, 0, 0)
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
    return this.getTasksOfToday().then(tasks => {
      return {
        numberOfTasks: tasks.length,
        completedTasks: tasks.filter(d => d.completed).length
      }
    })
  }

  areAllTasksComplete(tasks) {
    return (
      !tasks ||
      tasks.every(t => t.name === 'ESM' || t.isClinical || t.completed)
    )
  }

  isLastTask(task, todaysTasks) {
    return todaysTasks.then((tasks: Task[]) => {
      return (
        !tasks ||
        tasks.every(
          t => t.name === 'ESM' || t.completed || t.index === task.index
        )
      )
    })
  }

  isTaskValid(task) {
    const now = new Date().getTime()
    return (
      task.timestamp <= now &&
      task.timestamp + task.completionWindow > now &&
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
      const tenMinutesAgo = new Date().getTime() - DefaultESMCompletionWindow
      const offsetForward = DefaultTaskCompletionWindow
      return tasks.find(task => {
        switch (task.name) {
          case 'ESM':
            // NOTE: For ESM, just look from 10 mins before now
            return (
              task.timestamp >= tenMinutesAgo &&
              task.timestamp < tenMinutesAgo + offsetForward &&
              task.completed === false
            )
          default:
            // NOTE: Break out of the loop as soon as the next incomplete task is found
            return (
              task.timestamp + task.completionWindow >= Date.now() &&
              task.completed === false
            )
        }
      })
    }
  }
}
