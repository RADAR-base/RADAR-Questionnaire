import { EventEmitter, Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import {
  getMilliseconds,
  setDateTimeToMidnightEpoch
} from '../../../shared/utilities/time'
import { AppServerService } from '../app-server/app-server.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'

@Injectable({
  providedIn: 'root'
})
export abstract class ScheduleService {
  private readonly SCHEDULE_STORE = {
    SCHEDULE_TASKS: StorageKeys.SCHEDULE_TASKS,
    SCHEDULE_TASKS_ON_DEMAND: StorageKeys.SCHEDULE_TASKS_ON_DEMAND,
    SCHEDULE_TASKS_CLINICAL: StorageKeys.SCHEDULE_TASKS_CLINICAL,
    SCHEDULE_TASKS_COMPLETED: StorageKeys.SCHEDULE_TASKS_COMPLETED
  }
  changeDetectionEmitter: EventEmitter<void> = new EventEmitter<void>()

  constructor(
    protected storage: StorageService,
    protected logger: LogService
  ) {}

  abstract init()

  abstract generateSchedule(referenceTimestamp, utcOffsetPrev)

  abstract generateSingleAssessmentTask(
    assessment: Assessment,
    assessmentType,
    referenceDate: number
  )

  abstract getTasksForDate(date: Date, type: AssessmentType)

  isInitialised() {
    return false
  }

  getTasks(type: AssessmentType): Promise<Task[]> {
    switch (type) {
      case AssessmentType.SCHEDULED:
        return this.getScheduledTasks()
      case AssessmentType.ON_DEMAND:
        return this.getOnDemandTasks()
      case AssessmentType.CLINICAL:
        return this.getClinicalTasks()
      case AssessmentType.ALL:
        return Promise.all([
          this.getScheduledTasks(),
          this.getClinicalTasks(),
          this.getOnDemandTasks()
        ]).then(([scheduledTasks, clinicalTasks, onDemandTasks]) => {
          const allTasks = (scheduledTasks || [])
            .concat(onDemandTasks || [])
            .concat(clinicalTasks || [])
          allTasks.forEach(t => {
            if (t.notifications === undefined) {
              t.notifications = []
            }
          })
          return allTasks
        })
    }
  }

  getScheduledTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS)
  }

  getOnDemandTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS_ON_DEMAND)
  }

  getClinicalTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS_CLINICAL)
  }

  getCompletedTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS_COMPLETED)
  }

  getIncompleteTasks(): Promise<Task[]> {
    return this.getTasks(AssessmentType.ALL).then(tasks => {
      const now = new Date().getTime()
      return tasks
        .filter(
          d =>
            d && d.completed === false && d.timestamp + d.completionWindow < now
        )
        .slice(0, 100)
    })
  }

  getReportedIncompleteTasks(): Promise<Task[]> {
    // These tasks have been completed but have not yet been reported as complete to the app server
    return this.getTasks(AssessmentType.ALL).then(tasks => {
      const now = new Date().getTime()
      return tasks
        .filter(d => d.completed && !d.reportedCompletion)
        .slice(0, 100)
    })
  }

  setTasks(type: AssessmentType, tasks: Task[]): Promise<void> {
    const uniqueTasks = [
      ...new Map(
        tasks.map<[string, Task]>(task => [
          task.timestamp + '-' + task.name,
          task
        ])
      ).values()
    ]
    switch (type) {
      case AssessmentType.SCHEDULED:
        return this.setScheduledTasks(uniqueTasks)
      case AssessmentType.ON_DEMAND:
        return this.setOnDemandTasks(uniqueTasks)
      case AssessmentType.CLINICAL:
        return this.setClinicalTasks(uniqueTasks)
    }
  }

  setOnDemandTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS_ON_DEMAND, tasks)
  }

  setClinicalTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS_CLINICAL, tasks)
  }

  setScheduledTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS, tasks)
  }

  setCompletedTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS_COMPLETED, tasks)
  }

  addToCompletedTasks(task) {
    return this.storage.push(this.SCHEDULE_STORE.SCHEDULE_TASKS_COMPLETED, task)
  }

  insertTask(task): Promise<any> {
    const type = task.type
    return this.getTasks(type).then(tasks => {
      if (!tasks) return
      const updatedTasks = tasks.map(d => (d.id === task.id ? task : d))
      return this.setTasks(type, updatedTasks)
    })
  }

  updateTaskToReportedCompletion(updatedTask): Promise<any> {
    updatedTask.reportedCompletion = true
    return this.insertTask(updatedTask)
  }

  updateTaskToComplete(updatedTask): Promise<any> {
    updatedTask.completed = true
    updatedTask.timeCompleted = new Date().getTime()
    return this.insertTask(updatedTask)
  }

  reset() {
    return Promise.all([
      this.setClinicalTasks([]),
      this.setOnDemandTasks([]),
      this.setScheduledTasks([]),
      this.setCompletedTasks([])
    ])
  }

  consoleLogSchedule() {
    this.getTasks(AssessmentType.ALL).then(tasks => {
      let rendered = `\nSCHEDULE Total (${tasks.length})\n`
      rendered += tasks
        .sort(compareTasks)
        .slice(-10)
        .map(
          t =>
            `${t.timestamp}-${t.name} DATE ${new Date(t.timestamp)} NAME ${
              t.name
            }`
        )
        .reduce((a, b) => a + '\n' + b)

      this.logger.log(rendered)
    })
  }
}
