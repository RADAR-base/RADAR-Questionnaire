import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultScheduleReportRepeat,
  DefaultScheduleYearCoverage,
  DefaultTaskCompletionWindow,
  HOUR_MIN,
  MIN_SEC,
  SEC_MILLISEC
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment } from '../../shared/models/assessment'
import { TimeInterval } from '../../shared/models/protocol'
import { ReportScheduling } from '../../shared/models/report'
import { Task } from '../../shared/models/task'
import { StorageService } from './storage.service'

export const TIME_UNIT_MILLIS = {
  min: 60000,
  hour: 60000 * 60,
  day: 60000 * 60 * 24,
  week: 60000 * 60 * 24 * 7,
  month: 60000 * 60 * 24 * 7 * 31,
  year: 60000 * 60 * 24 * 365
}

const TIME_UNIT_MILLIS_DEFAULT =
  DefaultScheduleYearCoverage * TIME_UNIT_MILLIS.year

@Injectable()
export class SchedulingService {
  scheduleVersion: number
  configVersion: number
  enrolmentDate: number
  completedTasks = []
  upToDate: Promise<Boolean>
  assessments: Promise<Assessment[]>
  tzOffset: number
  utcOffsetPrev: number
  ONE_DAY = 24 * HOUR_MIN * MIN_SEC * SEC_MILLISEC

  constructor(public storage: StorageService) {
    const now = new Date()
    this.tzOffset = now.getTimezoneOffset()
    console.log(this.storage.global)
  }

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
    const startTime = this.setDateTimeToMidnight(date).getTime()
    const endTime = startTime + TIME_UNIT_MILLIS.day
    return this.getTasks().then(schedule =>
      schedule.filter(
        d =>
          d.timestamp + d.completionWindow >= startTime && d.timestamp < endTime
      )
    )
  }

  getNonClinicalTasksForDate(date) {
    return this.getDefaultTasks().then(schedule => {
      const tasks: Task[] = []
      if (schedule) {
        const startTime = this.setDateTimeToMidnight(date).getTime()
        const endTime = startTime + TIME_UNIT_MILLIS.day
        for (let i = 0; i < schedule.length; i++) {
          const task = schedule[i]
          if (task.timestamp > endTime) break
          if (task.timestamp + task.completionWindow >= startTime)
            tasks.push(task)
        }
      }
      return tasks
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

  getCompletedTasks() {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS_COMPLETED)
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
            if (tasks[i]) {
              if (
                tasks[i].reportedCompletion === false &&
                tasks[i].timestamp + this.ONE_DAY < now &&
                limit > 0
              ) {
                nonReportedTasks.push(tasks[i])
                limit -= 1
              }
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
    const completedTasks = this.getCompletedTasks()
    const scheduleVProm = this.storage.get(StorageKeys.SCHEDULE_VERSION)
    const configVProm = this.storage.get(StorageKeys.CONFIG_VERSION)
    const refDate = this.storage.get(StorageKeys.ENROLMENTDATE)
    const utcOffsetPrev = this.storage.get(StorageKeys.UTC_OFFSET_PREV)

    return Promise.all([
      completedTasks,
      scheduleVProm,
      configVProm,
      refDate,
      utcOffsetPrev
    ]).then(data => {
      this.completedTasks = data[0] ? data[0] : []
      this.scheduleVersion = data[1]
      this.configVersion = data[2]
      this.enrolmentDate = data[3]
      this.utcOffsetPrev = data[4]
      if (data[1] !== data[2] || force) {
        console.log('Updating schedule..')
        return this.runScheduler()
      }
    })
  }

  runScheduler() {
    return this.getAssessments()
      .then(assessments => this.buildTaskSchedule(assessments))
      .catch(e => console.error(e))
      .then((schedule: Task[]) => this.setSchedule(schedule))
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

  addToCompletedTasks(task) {
    return this.storage.push(StorageKeys.SCHEDULE_TASKS_COMPLETED, task)
  }

  updateScheduleWithCompletedTasks(schedule): Task[] {
    // NOTE: If utcOffsetPrev exists, timezone has changed
    if (this.utcOffsetPrev != null) {
      this.storage
        .remove(StorageKeys.SCHEDULE_TASKS_COMPLETED)
        .then(() => {
          const currentMidnight = new Date().setHours(0, 0, 0, 0)
          const prevMidnight =
            new Date().setUTCHours(0, 0, 0, 0) + this.utcOffsetPrev * 60000
          this.completedTasks.map(d => {
            const index = schedule.findIndex(
              s =>
                s.timestamp - currentMidnight == d.timestamp - prevMidnight &&
                s.name == d.name
            )
            if (index > -1) {
              schedule[index].completed = true
              return this.addToCompletedTasks(schedule[index])
            }
          })
        })
        .then(() => this.storage.remove(StorageKeys.UTC_OFFSET_PREV))
    } else {
      this.completedTasks.map(d => {
        if (
          schedule[d.index].timestamp == d.timestamp &&
          schedule[d.index].name == d.name
        ) {
          return (schedule[d.index].completed = true)
        }
      })
    }
    return schedule
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
    // NOTE: Check for completed tasks
    const updatedSchedule = this.updateScheduleWithCompletedTasks(schedule)
    schedule = updatedSchedule.sort(SchedulingService.compareTasks)

    console.log('[√] Updated task schedule.')
    return Promise.resolve(schedule)
  }

  buildTasksForSingleAssessment(assessment, indexOffset) {
    const repeatP = assessment.protocol.repeatProtocol
    const repeatQ = assessment.protocol.repeatQuestionnaire

    let iterDate = this.setDateTimeToMidnight(new Date(this.enrolmentDate))
    const yearsMillis = DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
    const endDate = new Date(iterDate.getTime() + yearsMillis)

    console.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterDate.getTime() <= endDate.getTime()) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskDate = this.advanceRepeat(
          iterDate,
          repeatQ.unit,
          repeatQ.unitsFromZero[i]
        )

        if (taskDate.getTime() > today.getTime()) {
          const idx = indexOffset + tmpScheduleAll.length
          const task = this.taskBuilder(idx, assessment, taskDate)
          tmpScheduleAll.push(task)
        }
      }
      iterDate = this.setDateTimeToMidnight(iterDate)
      iterDate = this.advanceRepeat(iterDate, repeatP.unit, repeatP.amount)
    }

    return tmpScheduleAll
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
    const returnDate = new Date(date)
    switch (unit) {
      case 'min':
        return new Date(returnDate.setMinutes(date.getMinutes() + multiplier))
      case 'hour':
        return new Date(returnDate.setHours(date.getHours() + multiplier))
      case 'day':
        return new Date(returnDate.setDate(date.getDate() + multiplier))
      case 'week':
        return new Date(returnDate.setDate(date.getDate() + multiplier * 7))
      case 'month':
        return new Date(returnDate.setMonth(date.getMonth() + multiplier))
      case 'year':
        return new Date(returnDate.setFullYear(date.getFullYear() + multiplier))
      default:
        return new Date(
          date.setFullYear(date.getFullYear() + DefaultScheduleYearCoverage)
        )
    }
  }

  static timeIntervalToMillis(interval: TimeInterval): number {
    if (!interval) {
      return TIME_UNIT_MILLIS_DEFAULT
    }
    const unit = interval.unit in TIME_UNIT_MILLIS ? interval.unit : 'day'
    const amount = interval.amount ? interval.amount : 1
    return amount * TIME_UNIT_MILLIS[unit]
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
      completionWindow: SchedulingService.computeCompletionWindow(assessment),
      warning: assessment.warn,
      isClinical: false
    }
    return task
  }

  static computeCompletionWindow(assessment: Assessment): number {
    if (assessment.protocol.completionWindow) {
      return this.timeIntervalToMillis(assessment.protocol.completionWindow)
    } else if (assessment.name === 'ESM') {
      return DefaultESMCompletionWindow
    } else {
      return DefaultTaskCompletionWindow
    }
  }

  setSchedule(schedule) {
    return this.storage.set(StorageKeys.SCHEDULE_TASKS, schedule).then(() => {
      return this.storage.set(StorageKeys.SCHEDULE_VERSION, this.configVersion)
    })
  }

  buildReportSchedule() {
    let iterDate = this.setDateTimeToMidnight(new Date(this.enrolmentDate))
    const yearsMillis = DefaultScheduleYearCoverage * 60000 * 60 * 24 * 365
    const endDate = new Date(iterDate.getTime() + yearsMillis)
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

  consoleLogSchedule() {
    this.getTasks().then(tasks => {
      const tasksKeys = []
      for (let i = 0; i < tasks.length; i++) {
        tasksKeys.push(`${tasks[i].timestamp}-${tasks[i].name}`)
      }
      tasksKeys.sort()
      let rendered = `\nSCHEDULE Total (${tasksKeys.length})\n`
      for (let i = tasksKeys.length - 10; i < tasksKeys.length; i++) {
        const dateName = tasksKeys[i].split('-')
        rendered += `${tasksKeys[i]} DATE ${new Date(
          parseInt(dateName[0], 10)
        ).toString()} NAME ${dateName[1]}\n`
      }
      console.log(rendered)
    })
  }

  // NOTE: Define the order of the tasks - whether it is based on index or timestamp
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
