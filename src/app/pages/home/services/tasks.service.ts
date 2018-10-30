import { Injectable } from '@angular/core'

import { KafkaService } from '../../../core/services/kafka.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { Task, TasksProgress } from '../../../shared/models/task'

@Injectable()
export class TasksService {
  constructor(
    public storage: StorageService,
    private schedule: SchedulingService,
    private kafka: KafkaService
  ) {}

  getAssessment(task) {
    return this.storage.getAssessment(task)
  }

  getTasksOfToday() {
    const now = new Date()
    return this.schedule.getTasksForDate(now)
  }

  getTasksOfDate(timestamp) {
    return this.schedule.getTasksForDate(timestamp)
  }

  getTaskProgress() {
    return this.getTasksOfToday().then((tasks: Task[]) =>
      this.retrieveTaskProgress(tasks)
    )
  }

  retrieveTaskProgress(tasks): TasksProgress {
    const tasksProgress: TasksProgress = {
      numberOfTasks: 0,
      completedTasks: 0
    }
    if (tasks) {
      tasksProgress.numberOfTasks = tasks.length
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].completed) {
          tasksProgress.completedTasks += 1
        }
      }
      return tasksProgress
    }
  }

  getNextTask() {
    return this.getTasksOfToday().then((tasks: Task[]) => {
      return this.retrieveNextTask(tasks)
    })
  }

  areAllTasksComplete() {
    return this.getTasksOfToday().then((tasks: Task[]) => {
      if (tasks) {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].name !== 'ESM') {
            if (tasks[i].completed === false) {
              return false
            }
          }
        }
      }
      return true
    })
  }

  isLastTask(task) {
    return this.getTasksOfToday().then((tasks: Task[]) => {
      if (tasks) {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].name !== 'ESM') {
            if (tasks[i].completed === false && tasks[i].index !== task.index) {
              return false
            }
          }
        }
      }
      return true
    })
  }

  /**
   * This function Retrieves the most current next task from a list of tasks.
   * @param tasks : The list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  retrieveNextTask(tasks: Task[]): Task {
    if (tasks) {
      // NOTE: First sort the tasks based on timestamps so the first scheduled task in the list is returned first
      tasks.sort((t1, t2) => {
        return t1.timestamp - t2.timestamp
      })
      const now: Date = new Date()
      const offsetTimeESM: number = 1000 * 60 * 10 // 10 min
      let passedAtLeastOnce = false
      let nextIdx = 0
      let lookFromTimestamp: number = now.getTime()
      let lookToTimestamp: number = lookFromTimestamp
      for (let i = 0; i < tasks.length; i++) {
        switch (tasks[i].name) {
          case 'ESM':
            // NOTE: For ESM, just look from 10 mins before now
            lookFromTimestamp = new Date().getTime() - offsetTimeESM
            lookToTimestamp = lookFromTimestamp + 1000 * 60 * 60 * 12
            break

          default:
            // NOTE: Check from midnight for other tasks
            now.setHours(0, 0, 0, 0)
            lookFromTimestamp = now.getTime()
            lookToTimestamp = tasks[i].timestamp + 1000 * 60 * 60 * 12
        }

        if (
          tasks[i].timestamp >= lookFromTimestamp &&
          tasks[i].timestamp < lookToTimestamp &&
          tasks[i].completed === false
        ) {
          passedAtLeastOnce = true
          nextIdx = i
          // NOTE: Break out of the loop as soon as the next incomplete task is found
          break
        }
      }
      if (passedAtLeastOnce) {
        return tasks[nextIdx]
      }
    }
  }

  sendNonReportedTaskCompletion() {
    this.schedule.getNonReportedCompletedTasks().then(nonReportedTasks => {
      for (let i = 0; i < nonReportedTasks.length; i++) {
        this.kafka.prepareNonReportedTasksKafkaObject(nonReportedTasks[i])
        this.updateTaskToReportedCompletion(nonReportedTasks[i])
      }
    })
  }

  updateTaskToReportedCompletion(task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }
}
