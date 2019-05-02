import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultScheduleReportRepeat,
  DefaultScheduleYearCoverage,
  DefaultTaskCompletionWindow
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment } from '../../shared/models/assessment'
import { TimeInterval } from '../../shared/models/protocol'
import { ReportScheduling } from '../../shared/models/report'
import { Task } from '../../shared/models/task'
import {
  getMilliseconds,
  timeIntervalToMillis
} from '../../shared/utilities/time'
import { StorageService } from './storage.service'

@Injectable()
export class SchedulingService {
  scheduleVersion: number
  configVersion: number
  enrolmentDate: number
  completedTasks = []
  assessments: Promise<Assessment[]>
  utcOffsetPrev: number

  constructor(public storage: StorageService) {
    console.log(this.storage.global)
  }

  getNextTask() {
    return this.getTasks().then(schedule => {
      if (schedule) {
        const timestamp = Date.now()
        return schedule
          .filter(d => d.timestamp >= timestamp)
          .reduce((a, b) => (a.timestamp <= b.timestamp ? a : b))
      }
    })
  }

  getTasksForDate(date) {
    const startTime = this.setDateTimeToMidnight(date).getTime()
    const endTime = startTime + getMilliseconds({ days: 1 })
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
        const endTime = startTime + getMilliseconds({ days: 1 })
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
    return Promise.all([this.getDefaultTasks(), this.getClinicalTasks()]).then(
      tasks => tasks.filter(d => d).reduce((a, b) => a.concat(b))
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
    return Promise.all([this.getDefaultTasks(), this.getClinicalTasks()]).then(
      ([defaultTasks, clinicalTasks]) => {
        const tasks = defaultTasks.concat(clinicalTasks)
        const now = new Date().getTime()
        return tasks
          .filter(
            d =>
              d &&
              d.reportedCompletion === false &&
              d.timestamp + d.completionWindow < now
          )
          .slice(0, 100)
      }
    )
  }

  getCurrentReport() {
    return this.getReports().then(reports => {
      if (reports) {
        const now = new Date().getTime()
        const delta = DefaultScheduleReportRepeat + 1
        return reports
          .filter(d => d.timestamp <= now && d.timestamp + delta > now)
          .reduce((a, b) => (a.timestamp >= b.timestamp ? a : b))
      }
    })
  }

  getReports() {
    const schedule = this.storage.get(StorageKeys.SCHEDULE_REPORT)
    return Promise.resolve(schedule)
  }

  updateReport(updatedReport) {
    this.getReports().then(updatedReports => {
      updatedReports[updatedReport.index] = updatedReport
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
    ]).then(([completed, schedVersion, confVersion, enrolDate, offsetPrev]) => {
      this.completedTasks = completed ? completed : []
      this.scheduleVersion = schedVersion
      this.configVersion = confVersion
      this.enrolmentDate = enrolDate
      this.utcOffsetPrev = offsetPrev
      if (schedVersion !== confVersion || force) {
        console.log('Updating schedule..')
        return this.runScheduler()
      }
    })
  }

  runScheduler() {
    return this.getAssessments()
      .then(assessments => this.buildTaskSchedule(assessments))
      .catch(e => console.error(e))
      .then((schedule: Task[]) =>
        this.setSchedule(schedule.sort(SchedulingService.compareTasks))
      )
      .catch(e => console.error(e))
  }

  getAssessments() {
    return this.storage.get(StorageKeys.CONFIG_ASSESSMENTS)
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

  addToCompletedTasks(task) {
    return this.storage.push(StorageKeys.SCHEDULE_TASKS_COMPLETED, task)
  }

  updateScheduleWithCompletedTasks(schedule): Promise<Task[]> {
    // NOTE: If utcOffsetPrev exists, timezone has changed
    return Promise.all([
      this.storage.remove(StorageKeys.SCHEDULE_TASKS_COMPLETED),
      this.storage.remove(StorageKeys.UTC_OFFSET_PREV)
    ]).then(() => {
      const currentMidnight = new Date().setHours(0, 0, 0, 0)
      const prevMidnight =
        new Date().setUTCHours(0, 0, 0, 0) + this.utcOffsetPrev * 60000
      this.completedTasks.map(d => {
        const index = schedule.findIndex(
          s =>
            ((this.utcOffsetPrev != null &&
              s.timestamp - currentMidnight == d.timestamp - prevMidnight) ||
              (this.utcOffsetPrev == null && s.timestamp == d.timestamp)) &&
            s.name == d.name
        )
        if (index > -1 && !schedule[index].completed) {
          schedule[index].completed = true
          schedule[index].reportedCompletion = d.reportedCompletion
          schedule[index].timeCompleted = d.timeCompleted
          return this.addToCompletedTasks(schedule[index])
        }
      })
      return schedule
    })
  }

  buildTaskSchedule(assessments) {
    const schedule: Task[] = assessments.reduce(
      (a, b) => a.concat(this.buildTasksForSingleAssessment(b, a.length)),
      []
    )
    // NOTE: Check for completed tasks
    const updatedSchedule = this.updateScheduleWithCompletedTasks(schedule)

    console.log('[√] Updated task schedule.')
    return updatedSchedule
  }

  buildTasksForSingleAssessment(assessment, indexOffset) {
    const repeatP = assessment.protocol.repeatProtocol
    const repeatQ = assessment.protocol.repeatQuestionnaire

    let iterDate = this.setDateTimeToMidnight(new Date(this.enrolmentDate))
    const endDate = new Date(
      iterDate.getTime() +
        getMilliseconds({ years: DefaultScheduleYearCoverage })
    )
    const completionWindow = SchedulingService.computeCompletionWindow(
      assessment
    )

    console.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterDate.getTime() <= endDate.getTime()) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskDate = SchedulingService.advanceRepeat(iterDate, {
          unit: repeatQ.unit,
          amount: repeatQ.unitsFromZero[i]
        })

        if (taskDate.getTime() + completionWindow > today.getTime()) {
          const idx = indexOffset + tmpScheduleAll.length
          const task = SchedulingService.taskBuilder(
            idx,
            assessment,
            taskDate,
            completionWindow
          )
          tmpScheduleAll.push(task)
        }
      }
      iterDate = this.setDateTimeToMidnight(iterDate)
      iterDate = SchedulingService.advanceRepeat(iterDate, repeatP)
    }

    return tmpScheduleAll
  }

  setDateTimeToMidnight(date) {
    return new Date(new Date(date).setHours(0, 0, 0, 0))
  }

  static advanceRepeat(date: Date, interval: TimeInterval): Date {
    const returnDate = new Date(date)
    const multiplier = interval.amount
    switch (interval.unit) {
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

  static taskBuilder(
    index,
    assessment: Assessment,
    taskDate: Date,
    completionWindow
  ): Task {
    return {
      index: index,
      completed: false,
      reportedCompletion: false,
      timestamp: taskDate.getTime(),
      name: assessment.name,
      reminderSettings: assessment.protocol.reminders,
      nQuestions: assessment.questions.length,
      estimatedCompletionTime: assessment.estimatedCompletionTime,
      completionWindow: completionWindow,
      warning: assessment.warn,
      isClinical: false
    }
  }

  static computeCompletionWindow(assessment: Assessment): number {
    if (assessment.protocol.completionWindow) {
      return timeIntervalToMillis(assessment.protocol.completionWindow)
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
    const yearsMillis = getMilliseconds({ years: DefaultScheduleYearCoverage })
    const endDate = new Date(iterDate.getTime() + yearsMillis)
    const tmpSchedule: ReportScheduling[] = []

    while (iterDate.getTime() <= endDate.getTime()) {
      iterDate = SchedulingService.advanceRepeat(iterDate, {
        unit: 'day',
        amount: DefaultScheduleReportRepeat
      })
      const report = SchedulingService.reportBuilder(
        tmpSchedule.length,
        iterDate
      )
      tmpSchedule.push(report)
    }
    console.log('[√] Updated report schedule.')
    return Promise.resolve(tmpSchedule)
  }

  static reportBuilder(index: number, reportDate: Date): ReportScheduling {
    const timestamp = reportDate.getTime()
    return {
      index: index,
      timestamp: timestamp,
      viewed: false,
      firstViewedOn: 0,
      range: {
        timestampStart:
          timestamp - getMilliseconds({ days: DefaultScheduleReportRepeat }),
        timestampEnd: timestamp
      }
    }
  }

  setReportSchedule(schedule) {
    this.storage.set(StorageKeys.SCHEDULE_REPORT, schedule)
  }

  consoleLogSchedule() {
    this.getTasks().then(tasks => {
      let rendered = `\nSCHEDULE Total (${tasks.length})\n`
      rendered += tasks
        .sort(SchedulingService.compareTasks)
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
