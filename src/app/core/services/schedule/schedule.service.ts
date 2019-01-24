import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { Task } from '../../../shared/models/task'
import {
  getMilliseconds,
  setDateTimeToMidnight
} from '../../../shared/utilities/time'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'

@Injectable()
export class ScheduleService {
  configVersion: number
  refTimestamp: number
  completedTasks = []
  utcOffsetPrev: number

  constructor(
    private storage: StorageService,
    private schedule: ScheduleGeneratorService
  ) {}

  getTasksForDate(date) {
    return this.getTasks().then(schedule => {
      const startTime = setDateTimeToMidnight(date).getTime()
      const endTime = startTime + getMilliseconds({ days: 1 })
      return schedule.filter(
        d => d.timestamp >= startTime && d.timestamp < endTime
      )
    })
  }

  getTasks(): Promise<Task[]> {
    return Promise.all([this.getDefaultTasks(), this.getClinicalTasks()]).then(
      ([defaultTasks, clinicalTasks]) => {
        const allTasks = (defaultTasks || []).concat(clinicalTasks || [])
        allTasks.forEach(t => {
          if (t.notifications === undefined) {
            t.notifications = []
          }
        })
        return allTasks
      }
    )
  }

  getDefaultTasks(): Promise<Task[]> {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS)
  }

  getClinicalTasks(): Promise<Task[]> {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS_CLINICAL)
  }

  getCompletedTasks(): Promise<Task[]> {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS_COMPLETED)
  }

  getNonReportedCompletedTasks(): Promise<Task[]> {
    return this.getTasks().then(tasks => {
      const now = new Date().getTime()
      return tasks
        .filter(d => d && d.reportedCompletion === false && d.timestamp < now)
        .slice(0, 100)
    })
  }

  generateSchedule() {
    console.log('Updating schedule..')
    return Promise.all([
      this.getCompletedTasks(),
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.REFERENCEDATE),
      this.storage.get(StorageKeys.UTC_OFFSET_PREV)
    ])
      .then(([completedTasks, confVersion, refDate, utcOffsetPrev]) => {
        this.configVersion = confVersion
        this.refTimestamp = refDate
        return this.schedule.runScheduler(
          StorageKeys.SCHEDULE_TASKS,
          this.refTimestamp,
          completedTasks,
          utcOffsetPrev
        )
      })
      .then((tasks: Task[]) =>
        this.setSchedule(tasks, StorageKeys.SCHEDULE_TASKS)
      )
      .catch(e => console.error(e))
  }

  generateClinicalSchedule(assessment) {
    return this.schedule
      .runScheduler(
        StorageKeys.SCHEDULE_TASKS_CLINICAL,
        this.refTimestamp,
        [],
        assessment
      )
      .then((tasks: Task[]) =>
        this.setSchedule(tasks, StorageKeys.SCHEDULE_TASKS_CLINICAL)
      )
      .catch(e => console.error(e))
  }

  /**
   * Store the current schedule.
   * @param schedule tasks to store
   * @return current configuration version
   */
  setSchedule(schedule: Task[], key): Promise<number> {
    return this.storage
      .set(key, schedule)
      .then(() =>
        this.storage.set(StorageKeys.SCHEDULE_VERSION, this.configVersion)
      )
  }

  addToCompletedTasks(task) {
    return this.schedule.addToCompletedTasks(task)
  }

  insertTask(task): Promise<any> {
    let sKey: StorageKeys
    let taskPromise: Promise<any>
    if (task.isClinical) {
      sKey = StorageKeys.SCHEDULE_TASKS_CLINICAL
      taskPromise = this.getClinicalTasks()
    } else {
      sKey = StorageKeys.SCHEDULE_TASKS
      taskPromise = this.getDefaultTasks()
    }
    return taskPromise.then(tasks => {
      const updatedTasks = tasks.map(d => (d.index === task.index ? task : d))
      return this.storage.set(sKey, updatedTasks)
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
    this.getTasks().then(tasks => {
      let rendered = `\nSCHEDULE Total (${tasks.length})\n`
      rendered += tasks
        .sort(ScheduleService.compareTasks)
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

  static compareTasks(a, b) {
    const diff = a.timestamp - b.timestamp
    if (diff != 0) {
      return diff
    }
    const aName = a.name.toUpperCase()
    const bName = b.name.toUpperCase()
    if (aName < bName) {
      return -1
    } else if (aName > bName) {
      return 1
    } else {
      return 0
    }
  }
}
