import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import { TaskType, getTaskType } from '../../../shared/utilities/task-type'
import {
  getMilliseconds,
  setDateTimeToMidnight
} from '../../../shared/utilities/time'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'

@Injectable()
export class ScheduleService {
  private readonly SCHEDULE_STORE = {
    SCHEDULE_TASKS: StorageKeys.SCHEDULE_TASKS,
    SCHEDULE_TASKS_CLINICAL: StorageKeys.SCHEDULE_TASKS_CLINICAL,
    SCHEDULE_TASKS_COMPLETED: StorageKeys.SCHEDULE_TASKS_COMPLETED
  }

  constructor(
    private storage: StorageService,
    private schedule: ScheduleGeneratorService
  ) {}

  getTasks(type: TaskType): Promise<Task[]> {
    switch (type) {
      case TaskType.NON_CLINICAL:
        return this.getNonClinicalTasks()
      case TaskType.CLINICAL:
        return this.getClinicalTasks()
      case TaskType.ALL:
        return Promise.all([
          this.getNonClinicalTasks(),
          this.getClinicalTasks()
        ]).then(([defaultTasks, clinicalTasks]) => {
          const allTasks = (defaultTasks || []).concat(clinicalTasks || [])
          allTasks.forEach(t => {
            if (t.notifications === undefined) {
              t.notifications = []
            }
          })
          return allTasks
        })
    }
  }

  getTasksForDate(date: Date, type: TaskType) {
    return this.getTasks(type).then(schedule => {
      const startTime = setDateTimeToMidnight(date).getTime()
      const endTime = startTime + getMilliseconds({ days: 1 })
      return schedule.filter(d => {
        return (
          d.timestamp + d.completionWindow > startTime && d.timestamp < endTime
        )
      })
    })
  }

  getNonClinicalTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS)
  }

  getClinicalTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS_CLINICAL)
  }

  getCompletedTasks(): Promise<Task[]> {
    return this.storage.get(this.SCHEDULE_STORE.SCHEDULE_TASKS_COMPLETED)
  }

  getIncompleteTasks(): Promise<Task[]> {
    return this.getTasks(TaskType.ALL).then(tasks => {
      const now = new Date().getTime()
      return tasks
        .filter(
          d =>
            d && d.completed === false && d.timestamp + d.completionWindow < now
        )
        .slice(0, 100)
    })
  }

  setTasks(type: TaskType, tasks): Promise<void> {
    switch (type) {
      case TaskType.NON_CLINICAL:
        return this.setNonClinicalTasks(tasks)
      case TaskType.CLINICAL:
        return this.setClinicalTasks(tasks)
    }
  }

  setClinicalTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS_CLINICAL, tasks)
  }

  setNonClinicalTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS, tasks)
  }

  setCompletedTasks(tasks) {
    return this.storage.set(this.SCHEDULE_STORE.SCHEDULE_TASKS_COMPLETED, tasks)
  }

  addToCompletedTasks(task) {
    return this.storage.push(this.SCHEDULE_STORE.SCHEDULE_TASKS_COMPLETED, task)
  }

  generateSchedule(referenceDate, utcOffsetPrev) {
    console.log(referenceDate)
    console.log('Updating schedule..')
    return this.getCompletedTasks()
      .then(completedTasks => {
        return this.schedule.runScheduler(
          TaskType.NON_CLINICAL,
          referenceDate,
          completedTasks,
          utcOffsetPrev
        )
      })
      .catch(e => e)
      .then(res =>
        Promise.all([
          this.setTasks(TaskType.NON_CLINICAL, res.schedule),
          this.setCompletedTasks(res.crompleted)
        ])
      )
  }

  generateClinicalSchedule(assessment, referenceDate) {
    return this.schedule
      .runScheduler(TaskType.CLINICAL, referenceDate, [], assessment)
      .catch(e => e)
      .then(res => this.setTasks(TaskType.CLINICAL, res.schedule))
  }

  insertTask(task): Promise<any> {
    const type = getTaskType(task)
    return this.getTasks(type).then(tasks => {
      const updatedTasks = tasks.map(d => (d.index === task.index ? task : d))
      return this.setTasks(type, updatedTasks)
    })
  }

  updateTaskToReportedCompletion(updatedTask): Promise<any> {
    updatedTask.reportedCompletion = true
    return this.insertTask(updatedTask)
  }

  updateTaskToComplete(updatedTask): Promise<any> {
    updatedTask.completed = true
    return this.insertTask(updatedTask)
  }

  consoleLogSchedule() {
    this.getTasks(TaskType.ALL).then(tasks => {
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

      console.log(rendered)
    })
  }
}
