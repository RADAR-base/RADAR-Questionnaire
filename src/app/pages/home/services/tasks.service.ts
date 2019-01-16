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

  getTaskProgress(tasks): TasksProgress {
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

  getNextTask(tasks) {
    return this.retrieveNextTask(tasks)
  }

  areAllTasksComplete() {
    return this.getTasksOfToday().then((tasks: Task[]) => {
      if (tasks) {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].name !== 'ESM' && tasks[i].isClinical == false) {
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
      const now = new Date()
      const offsetTimeESM = 1000 * 60 * 10 // 10 min
      const offsetForward = 1000 * 60 * 60 * 12
      let lookFromTimestamp, lookToTimestamp
      for (let i = 0; i < tasks.length; i++) {
        switch (tasks[i].name) {
          case 'ESM':
            // NOTE: For ESM, just look from 10 mins before now
            lookFromTimestamp = new Date().getTime() - offsetTimeESM
            lookToTimestamp = lookFromTimestamp + offsetForward
            break

          default:
            // NOTE: Check from midnight for other tasks
            now.setHours(0, 0, 0, 0)
            lookFromTimestamp = now.getTime()
            lookToTimestamp = tasks[i].timestamp + offsetForward
        }
        // NOTE: Break out of the loop as soon as the next incomplete task is found
        if (
          tasks[i].timestamp >= lookFromTimestamp &&
          tasks[i].timestamp < lookToTimestamp &&
          tasks[i].completed === false
        )
          return tasks[i]
      }
    }
  }

  sendNonReportedTaskCompletion() {
    this.schedule.getNonReportedCompletedTasks().then(nonReportedTasks => {
      for (let i = 0; i < nonReportedTasks.length; i++) {
        this.kafka.prepareNonReportedTasksKafkaObjectAndSend(
          nonReportedTasks[i]
        )
        this.updateTaskToReportedCompletion(nonReportedTasks[i])
      }
    })
  }

  updateTaskToReportedCompletion(task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }


  formatTime(date) {
    const hour = date.getHours()
    const min = date.getMinutes()
    const hourStr = date.getHours() < 10 ? '0' + String(hour) : String(hour)
    const minStr = date.getMinutes() < 10 ? '0' + String(min) : String(min)
    return hourStr + ':' + minStr
  }
}
