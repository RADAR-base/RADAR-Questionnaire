import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultScheduleYearCoverage,
  DefaultTaskCompletionWindow
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment } from '../../shared/models/assessment'
import { TimeInterval } from '../../shared/models/protocol'
import { Task } from '../../shared/models/task'
import {
  getMilliseconds,
  timeIntervalToMillis
} from '../../shared/utilities/time'
import { StorageService } from './storage.service'
import { LocalizationService } from './localization.service'
import { NotificationGeneratorService } from './notification-generator.service'
import { LogService } from './log.service'

@Injectable()
export class SchedulingService {
  scheduleVersion: number
  configVersion: number
  enrolmentDate: number
  completedTasks = []
  assessments: Promise<Assessment[]>
  utcOffsetPrev: number

  constructor(
    private storage: StorageService,
    private localization: LocalizationService,
    private notificationService: NotificationGeneratorService,
    private logger: LogService,
  ) {
    this.logger.log(this.storage.global)
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
        .filter(
          d =>
            d &&
            d.reportedCompletion === false &&
            d.timestamp + d.completionWindow < now
        )
        .slice(0, 100)
    })
  }

  generateSchedule(force: boolean) {
    return Promise.all([
      this.getCompletedTasks(),
      this.storage.get(StorageKeys.SCHEDULE_VERSION),
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.ENROLMENTDATE),
      this.storage.get(StorageKeys.UTC_OFFSET_PREV)
    ]).then(([completed, schedVersion, confVersion, enrolDate, offsetPrev]) => {
      this.completedTasks = completed || []
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
    return this.storage
      .get(StorageKeys.CONFIG_ASSESSMENTS)
      .then(assessments => this.buildTaskSchedule(assessments))
      .catch(e => console.error(e))
      .then((schedule: Task[]) =>
        this.setSchedule(schedule.sort(SchedulingService.compareTasks))
      )
      .catch(e => console.error(e))
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
        new Date().setUTCHours(0, 0, 0, 0) +
        getMilliseconds({ minutes: this.utcOffsetPrev })
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

  buildTaskSchedule(assessments: Assessment[]): Promise<Task[]> {
    const schedule: Task[] = assessments.reduce(
      (list, assessment) =>
        list.concat(
          this.buildTasksForSingleAssessment(assessment, list.length)
        ),
      []
    )
    // NOTE: Check for completed tasks
    const updatedSchedule = this.updateScheduleWithCompletedTasks(schedule)

    console.log('[√] Updated task schedule.')
    return updatedSchedule
  }

  buildTasksForSingleAssessment(
    assessment: Assessment,
    indexOffset: number
  ): Task[] {
    const repeatP = assessment.protocol.repeatProtocol
    const repeatQ = assessment.protocol.repeatQuestionnaire

    let iterTime = this.setDateTimeToMidnight(
      new Date(this.enrolmentDate)
    ).getTime()
    const endTime =
      iterTime + getMilliseconds({ years: DefaultScheduleYearCoverage })
    const completionWindow = SchedulingService.computeCompletionWindow(
      assessment
    )
    this.logger.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterTime <= endTime) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskTime = SchedulingService.advanceRepeat(iterTime, {
          unit: repeatQ.unit,
          amount: repeatQ.unitsFromZero[i]
        })

        if (taskTime + completionWindow > today.getTime()) {
          const idx = indexOffset + tmpScheduleAll.length
          const task = this.taskBuilder(
            idx,
            assessment,
            taskTime,
            completionWindow
          )
          tmpScheduleAll.push(task)
        }
      }
      iterTime = this.setDateTimeToMidnight(new Date(iterTime)).getTime()
      iterTime = SchedulingService.advanceRepeat(iterTime, repeatP)
    }

    return tmpScheduleAll
  }

  setDateTimeToMidnight(date: Date): Date {
    return new Date(new Date(date).setHours(0, 0, 0, 0))
  }

  static advanceRepeat(timestamp: number, interval: TimeInterval) {
    const date = new Date(timestamp)
    const returnDate = new Date(timestamp)
    switch (interval.unit) {
      case 'min':
        return returnDate.setMinutes(date.getMinutes() + interval.amount)
      case 'hour':
        return returnDate.setHours(date.getHours() + interval.amount)
      case 'day':
        return returnDate.setDate(date.getDate() + interval.amount)
      case 'week':
        const ONE_WEEK = 7
        return returnDate.setDate(date.getDate() + interval.amount * ONE_WEEK)
      case 'month':
        return returnDate.setMonth(date.getMonth() + interval.amount)
      case 'year':
        return returnDate.setFullYear(date.getFullYear() + interval.amount)
      default:
        return returnDate.setFullYear(
          date.getFullYear() + DefaultScheduleYearCoverage
        )
    }
  }

  taskBuilder(
    index,
    assessment: Assessment,
    timestamp: number,
    completionWindow: number
  ): Task {
    const task: Task = {
      index,
      timestamp,
      completed: false,
      reportedCompletion: false,
      name: assessment.name,
      nQuestions: assessment.questions.length,
      estimatedCompletionTime: assessment.estimatedCompletionTime,
      completionWindow: completionWindow,
      warning: this.localization.chooseText(assessment.warn),
      isClinical: false
    }
    task.notifications = this.notificationService.createNotifications(
      assessment,
      task
    )
    return task
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

  /**
   * Store the current schedule.
   * @param schedule tasks to store
   * @return current configuration version
   */
  setSchedule(schedule: Task[]): Promise<number> {
    return this.storage
      .set(StorageKeys.SCHEDULE_TASKS, schedule)
      .then(() =>
        this.storage.set(StorageKeys.SCHEDULE_VERSION, this.configVersion)
      )
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

      this.logger.log(rendered)
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
