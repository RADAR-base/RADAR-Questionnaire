import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import {
  DefaultScheduleReportRepeat,
  DefaultScheduleYearCoverage
} from '../assets/data/defaultConfig'
import { StorageKeys } from '../enums/storage'
import { Assessment } from '../models/assessment'
import { Protocol, Reminders, RepeatProtocol } from '../models/protocol'
import { ReportScheduling } from '../models/report'
import { Task } from '../models/task'
import { StorageService } from './storage-service'

@Injectable()
export class SchedulingService {
  scheduleVersion: number
  configVersion: number
  refTimestamp: number
  schedule: Task[]
  upToDate: Promise<Boolean>
  assessments: Promise<Assessment[]>
  tzOffset: number

  constructor(public storage: StorageService) {
    const now = new Date()
    this.tzOffset = now.getTimezoneOffset()
    console.log(this.storage.global)
  }

  setNotification(task) {}

  getNextTask() {
    return this.getTasks().then(schedule => {
      if (schedule) {
        const timestamp = Date.now()
        let nextIdx = 0
        let nextTimestamp = timestamp * 2
        for (let i = 0; i < schedule.length; i++) {
          if (
            schedule[i].timestamp >= timestamp &&
            schedule[i].timestamp < nextTimestamp
          ) {
            nextTimestamp = schedule[i].timestamp
            nextIdx = i
          }
        }
        return schedule[nextIdx]
      }
    })
  }

  getTasksForDate(date) {
    return this.getTasks().then(schedule => {
      if (schedule) {
        const startDate = this.setDateTimeToMidnight(date)
        const endDate = this.advanceRepeat(startDate, 'day', 1)
        const tasks: Task[] = []
        for (let i = 0; i < schedule.length; i++) {
          if (
            schedule[i].timestamp < endDate.getTime() &&
            schedule[i].timestamp > startDate.getTime()
          ) {
            tasks.push(schedule[i])
          }
        }
        return tasks
      }
    })
  }

  getTasks() {
    const defaultTasks = this.getDefaultTasks()
    const clinicalTasks = this.getClinicalTasks()
    return Promise.resolve(
      Promise.all([defaultTasks, clinicalTasks]).then(
        defaultAndClinicalTasks => {
          const tasks: Task[] = []
          for (let i = 0; i < defaultAndClinicalTasks.length; i++) {
            if (defaultAndClinicalTasks[i]) {
              for (let j = 0; j < defaultAndClinicalTasks[i].length; j++) {
                tasks.push(defaultAndClinicalTasks[i][j])
              }
            }
          }
          return tasks
        }
      )
    )
  }

  getDefaultTasks() {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS)
  }

  getClinicalTasks() {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS_CLINICAL)
  }

  getNonReportedCompletedTasks() {
    const defaultTasks = this.getDefaultTasks()
    const clinicalTasks = this.getClinicalTasks()
    return Promise.resolve(
      Promise.all([defaultTasks, clinicalTasks]).then(
        defaultAndClinicalTasks => {
          const tasks = defaultAndClinicalTasks[0].concat(
            defaultAndClinicalTasks[1]
          )
          const nonReportedTasks = []
          const now = new Date().getTime()
          let limit = 100
          for (let i = 0; i < tasks.length; i++) {
            if (
              tasks[i].reportedCompletion === false &&
              tasks[i].timestamp < now &&
              limit > 0
            ) {
              nonReportedTasks.push(tasks[i])
              limit -= 1
            }
          }
          return nonReportedTasks
        }
      )
    )
  }

  getCurrentReport() {
    return this.getReports().then(reports => {
      if (reports) {
        const now = new Date()
        let delta = DefaultScheduleReportRepeat + 1
        let idx = 0
        for (let i = 0; i < reports.length; i++) {
          const tmpDelta = now.getTime() - reports[i]['timestamp']
          if (tmpDelta < delta && tmpDelta >= 0) {
            delta = tmpDelta
            idx = i
          }
        }
        return reports[idx]
      }
    })
  }

  getReports() {
    const schedule = this.storage.get(StorageKeys.SCHEDULE_REPORT)
    return Promise.resolve(schedule)
  }

  updateReport(updatedReport) {
    this.getReports().then(reports => {
      const updatedReports = reports
      updatedReports[updatedReport['index']] = updatedReport
      this.setReportSchedule(updatedReports)
    })
  }

  generateSchedule(force: boolean) {
    const scheduleVProm = this.storage.get(StorageKeys.SCHEDULE_VERSION)
    const configVProm = this.storage.get(StorageKeys.CONFIG_VERSION)
    const refDate = this.storage.get(StorageKeys.REFERENCEDATE)

    return Promise.all([scheduleVProm, configVProm, refDate]).then(data => {
      this.scheduleVersion = data[0]
      this.configVersion = data[1]
      this.refTimestamp = data[2]
      if (data[0] !== data[1] || force) {
        console.log('Changed protocol version detected. Updating schedule..')
        return this.runScheduler()
      }
    })
  }

  runScheduler() {
    this.buildReportSchedule()
      .then(schedule => this.setReportSchedule(schedule))
      .catch(e => console.error(e))

    return this.getAssessments()
      .then(assessments => this.buildTaskSchedule(assessments))
      .catch(e => console.error(e))
      .then(schedule => {
        return this.setSchedule(schedule)
      })
      .catch(e => console.error(e))
  }

  getAssessments() {
    return this.storage.get(StorageKeys.CONFIG_ASSESSMENTS)
  }

  insertTask(task): Promise<any> {
    let sKey = StorageKeys.SCHEDULE_TASKS
    let taskPromise = this.getDefaultTasks()
    if (task.isClinical) {
      sKey = StorageKeys.SCHEDULE_TASKS_CLINICAL
      taskPromise = this.getClinicalTasks()
    }
    return taskPromise.then(tasks => {
      const updatedTasks = tasks.map(d => (d.index === task.index ? task : d))
      return this.storage.set(sKey, updatedTasks)
    })
  }

  buildTaskSchedule(assessments) {
    let schedule: Task[] = []
    let scheduleLength = schedule.length
    for (let i = 0; i < assessments.length; i++) {
      const tmpSchedule = this.buildTasksForSingleAssessment(
        assessments[i],
        scheduleLength
      )
      schedule = schedule.concat(tmpSchedule)
      scheduleLength = schedule.length
    }
    console.log('[√] Updated task schedule.')
    return Promise.resolve(schedule)
  }

  buildTasksForSingleAssessment(assessment, indexOffset) {
    const repeatP = assessment.protocol.repeatProtocol
    const repeatQ = assessment.protocol.repeatQuestionnaire

    let iterDate = new Date(this.refTimestamp)
    const yearsMillis = DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
    const endDate = new Date(this.refTimestamp + yearsMillis)

    console.log(assessment)

    const tmpScheduleAll: Task[] = []
    while (iterDate.getTime() <= endDate.getTime()) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskDate = this.advanceRepeat(
          iterDate,
          repeatQ.unit,
          repeatQ.unitsFromZero[i]
        )
        const idx = indexOffset + tmpScheduleAll.length
        tmpScheduleAll.push(this.taskBuilder(idx, assessment, taskDate))
      }
      iterDate = this.setDateTimeToMidnight(iterDate)
      iterDate = this.advanceRepeat(iterDate, repeatP.unit, repeatP.amount)
    }

    const tmpSchedule: Task[] = []
    const today = this.setDateTimeToMidnight(new Date())
    for (let i = 0; i < tmpScheduleAll.length; i++) {
      if (tmpScheduleAll[i].timestamp > today.getTime()) {
        tmpSchedule.push(tmpScheduleAll[i])
      }
    }
    return tmpSchedule
  }

  setDateTimeToMidnight(date) {
    let resetDate: Date
    if (this.tzOffset === date.getTimezoneOffset()) {
      resetDate = new Date(date.setHours(1, 0, 0, 0))
    } else {
      resetDate = new Date(date.setHours(0, 0, 0, 0))
    }
    this.tzOffset = date.getTimezoneOffset()
    return resetDate
  }

  advanceRepeat(date, unit, multiplier) {
    let returnDate = new Date(date.getTime())
    switch (unit) {
      case 'min':
        returnDate = new Date(date.getTime() + multiplier * 60000)
        break
      case 'hour':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60)
        break
      case 'day':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60 * 24)
        break
      case 'week':
        returnDate = new Date(date.getTime() + multiplier * 60000 * 60 * 24 * 7)
        break
      case 'month':
        returnDate = new Date(
          date.getTime() + multiplier * 60000 * 60 * 24 * 31
        )
        break
      case 'year':
        returnDate = new Date(
          date.getTime() + multiplier * 60000 * 60 * 24 * 365
        )
        break
      default:
        returnDate = new Date(
          date.getTime() + DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
        )
        break
    }
    return returnDate
  }

  taskBuilder(index, assessment, taskDate): Task {
    const task: Task = {
      index: index,
      completed: false,
      reportedCompletion: false,
      timestamp: taskDate.getTime(),
      name: assessment.name,
      reminderSettings: assessment.protocol.reminders,
      nQuestions: assessment.questions.length,
      estimatedCompletionTime: assessment.estimatedCompletionTime,
      warning: assessment.warn,
      isClinical: false
    }
    return task
  }

  setSchedule(schedule) {
    // console.log(schedule)
    return this.storage.set(StorageKeys.SCHEDULE_TASKS, schedule).then(() => {
      return this.storage.set(StorageKeys.SCHEDULE_VERSION, this.configVersion)
    })
  }

  buildReportSchedule() {
    let iterDate = new Date(this.refTimestamp)
    iterDate = this.setDateTimeToMidnight(iterDate)
    const yearsMillis = DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
    const endDate = new Date(this.refTimestamp + yearsMillis)
    const tmpSchedule: ReportScheduling[] = []

    while (iterDate.getTime() <= endDate.getTime()) {
      iterDate = this.advanceRepeat(
        iterDate,
        'day',
        DefaultScheduleReportRepeat
      )
      const report = this.reportBuilder(tmpSchedule.length, iterDate)
      tmpSchedule.push(report)
    }
    console.log('[√] Updated report schedule.')
    return Promise.resolve(tmpSchedule)
  }

  reportBuilder(index, reportDate): ReportScheduling {
    const report = {
      index: index,
      timestamp: reportDate.getTime(),
      viewed: false,
      firstViewedOn: 0,
      range: {
        timestampStart:
          reportDate.getTime() - DefaultScheduleReportRepeat * 60000 * 60 * 24,
        timestampEnd: reportDate.getTime()
      }
    }
    return report
  }

  setReportSchedule(schedule) {
    this.storage.set(StorageKeys.SCHEDULE_REPORT, schedule)
  }
}
