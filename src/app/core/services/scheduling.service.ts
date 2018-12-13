import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import {
  DefaultScheduleReportRepeat,
  DefaultScheduleYearCoverage,
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment } from '../../shared/models/assessment'
import { ReportScheduling } from '../../shared/models/report'
import { Task } from '../../shared/models/task'
import { StorageService } from './storage.service'
import { TimeInterval } from '../../shared/models/protocol'

export const TIME_UNIT_MILLIS = {
  min: 60000,
  hour: 60000 * 60,
  day: 60000 * 60 * 24,
  week: 60000 * 60 * 24 * 7,
  month: 60000 * 60 * 24 * 7 * 31,
  year: 60000 * 60 * 24 * 365,
}

const TIME_UNIT_MILLIS_DEFAULT = DefaultScheduleYearCoverage * TIME_UNIT_MILLIS.year

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

  constructor(public storage: StorageService) {
    const now = new Date()
    this.tzOffset = now.getTimezoneOffset()
    console.log(this.storage.global)
  }

  getNextTask() {
    return this.getTasks().then(schedule => {
      if (schedule) {
        const timestamp = Date.now()
        return schedule.filter(d => d.timestamp >= timestamp)
          .reduce((a, b) => a.timestamp <= b.timestamp ? a : b)
      }
    })
  }

  getTasksForDate(date) {
    return this.getTasks().then(schedule => {
      if (schedule) {
        const startDate = this.setDateTimeToMidnight(date)
        const endDate = SchedulingService.advanceRepeat(startDate, {
          unit: 'day',
          amount: 1,
        })
        return schedule.filter(d =>
          d.timestamp >= startDate.getTime() && d.timestamp < endDate.getTime())
      }
    })
  }

  getTasks(): Promise<Task[]> {
    const defaultTasks = this.getDefaultTasks()
    const clinicalTasks = this.getClinicalTasks()
    return Promise.all([defaultTasks, clinicalTasks])
      .then(tasks =>
          tasks.filter(d => d)
              .reduce((a, b) => a.concat(b)))
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
        defaultAndClinicalTasks => {
          const tasks = defaultAndClinicalTasks[0].concat(
            defaultAndClinicalTasks[1]
          )
          const now = new Date().getTime()
          return tasks.filter(d => d && d.reportedCompletion === false && d.timestamp < now)
            .slice(0, 100)
        }
      )
  }

  getCurrentReport() {
    return this.getReports().then(reports => {
      if (reports) {
        const now = new Date().getTime()
        const delta = DefaultScheduleReportRepeat + 1
        return reports.filter(d => d.timestamp <= now && d.timestamp + delta > now)
            .reduce((a, b) => a.timestamp >= b.timestamp ? a : b)
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
    // NOTE: Temporarily turn off build report schedule.
    // this.buildReportSchedule()
    //   .then(schedule => this.setReportSchedule(schedule))
    //   .catch(e => console.error(e))

    return Promise.all([
      this.storage.get(StorageKeys.CONFIG_ASSESSMENTS),
      this.storage.get(StorageKeys.LANGUAGE),
    ])
      .then(([assessments, language]) => this.buildTaskSchedule(assessments, language))
      .catch(e => console.error(e))
      .then((schedule: Task[]) => this.setSchedule(schedule))
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
      const updatedTasks = tasks.map(d => d.index === task.index ? task : d)
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
            new Date().setUTCHours(0, 0, 0, 0) + this.utcOffsetPrev * TIME_UNIT_MILLIS.min

          this.completedTasks.map(d => {
            const finishedToday = schedule.find(s =>
              s.timestamp - currentMidnight == d.timestamp - prevMidnight
              && s.name == d.name)
            if (finishedToday !== undefined) {
              finishedToday.completed = true
              return this.addToCompletedTasks(finishedToday)
            }
          })
        })
        .then(() => this.storage.remove(StorageKeys.UTC_OFFSET_PREV))
    } else {
      this.completedTasks.forEach(d => {
        const task = schedule[d.index]
        if (
          task.timestamp == d.timestamp &&
          task.name == d.name
        ) {
          task.completed = true
        }
      })
    }
    return schedule
  }

  buildTaskSchedule(assessments, language: string) {
    let schedule: Task[] = assessments.reduce((a, b) =>
        a.concat(this.buildTasksForSingleAssessment(b, a.length, language)), [])
    // NOTE: Check for completed tasks
    const updatedSchedule = this.updateScheduleWithCompletedTasks(schedule)
    schedule = updatedSchedule.sort((a, b) => a.timestamp - b.timestamp)

    console.log('[√] Updated task schedule.')
    return Promise.resolve(schedule)
  }

  buildTasksForSingleAssessment(assessment, indexOffset, language: string) {
    const repeatP = assessment.protocol.repeatProtocol
    const repeatQ = assessment.protocol.repeatQuestionnaire

    let iterDate = this.setDateTimeToMidnight(new Date(this.enrolmentDate))
    const endDate = new Date(iterDate.getTime() + TIME_UNIT_MILLIS_DEFAULT)

    console.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterDate.getTime() <= endDate.getTime()) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskDate = SchedulingService.advanceRepeat(
          iterDate,
          {
            unit: repeatQ.unit,
            amount: repeatQ.unitsFromZero[i],
          })

        if (taskDate.getTime() > today.getTime()) {
          const idx = indexOffset + tmpScheduleAll.length
          const task = SchedulingService.taskBuilder(idx, assessment, taskDate, language)
          tmpScheduleAll.push(task)
        }
      }
      iterDate = this.setDateTimeToMidnight(iterDate)
      iterDate = SchedulingService.advanceRepeat(iterDate, repeatP)
    }

    return tmpScheduleAll
  }

  setDateTimeToMidnight(date: Date): Date {
    let resetDate: Date
    if (this.tzOffset === date.getTimezoneOffset()) {
      resetDate = new Date(date.setHours(1, 0, 0, 0))
    } else {
      resetDate = new Date(date.setHours(0, 0, 0, 0))
    }
    this.tzOffset = date.getTimezoneOffset()
    return resetDate
  }

  static advanceRepeat(date: Date, interval: TimeInterval): Date {
    return new Date(date.getTime() + this.timeIntervalToMillis(interval))
  }

  static timeIntervalToMillis(interval: TimeInterval): number {
    if (!interval) {
      return TIME_UNIT_MILLIS_DEFAULT;
    }
    const unit = interval.unit in TIME_UNIT_MILLIS ? interval.unit : 'day'
    const amount = interval.amount ? interval.amount : 1
    return amount * TIME_UNIT_MILLIS[unit]
  }

  static taskBuilder(index, assessment: Assessment, taskDate: Date, language: string): Task {
    return {
      index: index,
      completed: false,
      reportedCompletion: false,
      timestamp: taskDate.getTime(),
      name: assessment.name,
      reminderSettings: assessment.protocol.reminders,
      nQuestions: assessment.questions.length,
      estimatedCompletionTime: assessment.estimatedCompletionTime,
      completionWindow: SchedulingService.computeCompletionWindow(assessment),
      warning: assessment.warn[language],
      isClinical: false
    }
  }

  static computeCompletionWindow(assessment: Assessment): number {
    if (assessment.protocol.completionWindow) {
      return this.timeIntervalToMillis(assessment.protocol.completionWindow)
    } else if (assessment.name === 'ESM') {
      return TIME_UNIT_MILLIS.min * 15;
    } else {
      return TIME_UNIT_MILLIS.day;
    }
  }

  setSchedule(schedule) {
    return this.storage.set(StorageKeys.SCHEDULE_TASKS, schedule).then(() => {
      return this.storage.set(StorageKeys.SCHEDULE_VERSION, this.configVersion)
    })
  }

  buildReportSchedule() {
    let iterDate = this.setDateTimeToMidnight(new Date(this.enrolmentDate))
    const yearsMillis = DefaultScheduleYearCoverage * TIME_UNIT_MILLIS.year
    const endDate = new Date(iterDate.getTime() + yearsMillis)
    const tmpSchedule: ReportScheduling[] = []

    while (iterDate.getTime() <= endDate.getTime()) {
      iterDate = SchedulingService.advanceRepeat(
        iterDate,
        {
          unit: 'day',
          amount: DefaultScheduleReportRepeat
        })
      const report = SchedulingService.reportBuilder(tmpSchedule.length, iterDate)
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
        timestampStart: timestamp - DefaultScheduleReportRepeat * TIME_UNIT_MILLIS.day,
        timestampEnd: timestamp,
      }
    }
  }

  setReportSchedule(schedule) {
    this.storage.set(StorageKeys.SCHEDULE_REPORT, schedule)
  }

  consoleLogSchedule() {
    this.getTasks().then(tasks => {
      let rendered = `\nSCHEDULE Total (${tasks.length})\n`
      rendered += tasks.sort(SchedulingService.compareTasks)
        .slice(-10)
        .map(t => `${t.timestamp}-${t.name} DATE ${new Date(t.timestamp)} NAME ${t.name}`)
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
      return -1;
    } else if (aName > bName) {
      return 1;
    } else {
      return 0;
    }
  }
}
