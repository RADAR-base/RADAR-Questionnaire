import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { AssessmentType } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import {
  getMilliseconds,
  setDateTimeToMidnight
} from '../../../shared/utilities/time'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'

@Injectable()
export class ScheduleService {
  private readonly SCHEDULE_STORE = {
    SCHEDULE_TASKS: StorageKeys.SCHEDULE_TASKS,
    SCHEDULE_TASKS_ON_DEMAND: StorageKeys.SCHEDULE_TASKS_ON_DEMAND,
    SCHEDULE_TASKS_CLINICAL: StorageKeys.SCHEDULE_TASKS_CLINICAL,
    SCHEDULE_TASKS_COMPLETED: StorageKeys.SCHEDULE_TASKS_COMPLETED
  }

  constructor(
    private storage: StorageService,
    private schedule: ScheduleGeneratorService,
    private logger: LogService
  ) {}

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
          this.getOnDemandTasks()
        ]).then(([scheduledTasks, onDemandTasks]) => {
          const allTasks = (scheduledTasks || []).concat(onDemandTasks || [])
          allTasks.forEach(t => {
            if (t.notifications === undefined) {
              t.notifications = []
            }
          })
          return allTasks
        })
    }
  }

  getTasksForDate(date: Date, type: AssessmentType) {
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

  setTasks(type: AssessmentType, tasks): Promise<void> {
    switch (type) {
      case AssessmentType.SCHEDULED:
        return this.setScheduledTasks(tasks)
      case AssessmentType.ON_DEMAND:
        return this.setOnDemandTasks(tasks)
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

  generateSchedule(referenceDate, utcOffsetPrev) {
    this.logger.log('Updating schedule..', referenceDate)
    return this.getCompletedTasks()
      .then(completedTasks => {
        return this.schedule.runScheduler(
          AssessmentType.SCHEDULED,
          referenceDate,
          completedTasks,
          utcOffsetPrev
        )
      })
      .catch(e => e)
      .then(res =>
        Promise.all([
          this.setTasks(AssessmentType.SCHEDULED, res.schedule),
          this.setCompletedTasks(res.completed)
        ])
      )
  }

  generateClinicalSchedule(assessment, referenceDate) {
    this.logger.log('Generating clinical schedule notifications..', assessment)
    return this.getClinicalTasks().then((tasks: Task[]) =>
      this.schedule
        .runScheduler(
          AssessmentType.CLINICAL,
          referenceDate,
          [],
          null,
          assessment,
          tasks ? tasks.length : 0
        )
        .then((res: any) =>
          this.setTasks(
            AssessmentType.CLINICAL,
            tasks ? tasks.concat(res.schedule) : res.schedule
          )
        )
    )
  }

  insertTask(task): Promise<any> {
    const type = task.type
    return this.getTasks(type).then(tasks => {
      if (!tasks) return
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
    updatedTask.timeCompleted = new Date().getTime()
    return this.insertTask(updatedTask)
  }

  reset() {
    return Promise.all([
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
