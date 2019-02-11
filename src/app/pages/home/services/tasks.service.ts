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

  getTaskProgress(tasks): TasksProgress {
    return {
      numberOfTasks: tasks.length,
      completedTasks: tasks.filter(d => d.completed).length
    }
  }

  areAllTasksComplete(tasks) {
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
  }

  isLastTask(task, tasks): boolean {
    return (
      !tasks ||
      tasks.every(
        t => t.name === 'ESM' || t.completed || t.index === task.index
      )
    )
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
   * @param tasks : The list of tasks to retrieve the next task from.
   * @returns {@link Task} : The next incomplete task from the list. This essentially
   *                         translates to which questionnaire the `START` button on home page corresponds to.
   */
  getNextTask(tasks: Task[]): Task | undefined {
    if (tasks) {
      return tasks.find(task => {
        switch (task.name) {
          case 'ESM':
            // NOTE: For ESM, just look from 10 mins before now
            return this.isTaskValid(task)
          default:
            // NOTE: Break out of the loop as soon as the next incomplete task is found
            return !task.completed
        }
      })
    }
  }

  sendNonReportedTaskCompletion() {
    this.schedule.getNonReportedCompletedTasks().then(nonReportedTasks => {
      for (let i = 0; i < nonReportedTasks.length; i++) {
        this.kafka
          .prepareNonReportedTasksKafkaObjectAndSend(nonReportedTasks[i])
          .then(() => this.updateTaskToReportedCompletion(nonReportedTasks[i]))
      }
    })
  }

  updateTaskToReportedCompletion(task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }
}
