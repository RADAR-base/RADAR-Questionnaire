import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'

import { DefaultScheduleYearCoverage } from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { Assessment, IconMetaData } from '../../shared/models/assessment'
import { TimeInterval } from '../../shared/models/protocol'
import { Task } from '../../shared/models/task'
import { getMilliseconds } from '../../shared/utilities/time'
import { LocalizationService } from './localization.service'
import { NotificationGeneratorService } from './notification-generator.service'
import { StorageService } from "./storage/storage.service";

export const TIME_UNIT_MILLIS = {
  min: getMilliseconds({ minutes: 1 }),
  hour: getMilliseconds({ hours: 1 }),
  day: getMilliseconds({ days: 1 }),
  week: getMilliseconds({ weeks: 1 }),
  month: getMilliseconds({ months: 1 }),
  year: getMilliseconds({ years: 1 })
}

const TIME_UNIT_MILLIS_DEFAULT = getMilliseconds({
  years: DefaultScheduleYearCoverage
})

@Injectable()
export class SchedulingService {
  scheduleVersion: number
  configVersion: number
  enrolmentDate: number
  completedTasks = []
  assessments: Promise<Assessment[]>
  tzOffset: number
  utcOffsetPrev: number

  constructor(
    private storage: StorageService,
    private notificationService: NotificationGeneratorService,
    private localization: LocalizationService
  ) {
    const now = new Date()
    this.tzOffset = now.getTimezoneOffset()
    console.log(this.storage.global)
  }

  getTasksForDate(date) {
    return this.getTasks().then(schedule => {
      const startTime = this.setDateTimeToMidnight(date).getTime()
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

  generateSchedule(force: boolean) {
    return Promise.all([
      this.getCompletedTasks(),
      this.storage.get(StorageKeys.SCHEDULE_VERSION),
      this.storage.get(StorageKeys.CONFIG_VERSION),
      this.storage.get(StorageKeys.ENROLMENTDATE),
      this.storage.get(StorageKeys.UTC_OFFSET_PREV)
    ]).then(([completed, schedVersion, confVersion, enrolDate, offsetPrev]) => {
      this.completedTasks = completed
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
      .then((tasks: Task[]) => this.setSchedule(tasks))
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

  updateScheduleWithCompletedTasks(schedule: Task[]): Task[] {
    // NOTE: If utcOffsetPrev exists, timezone has changed
    if (this.utcOffsetPrev != null) {
      this.storage
        .remove(StorageKeys.SCHEDULE_TASKS_COMPLETED)
        .then(() => {
          const currentMidnight = new Date().setHours(0, 0, 0, 0)
          const prevMidnight =
            new Date().setUTCHours(0, 0, 0, 0) +
            getMilliseconds({ minutes: this.utcOffsetPrev })
          return this.completedTasks.map(d => {
            const finishedToday = schedule.find(
              s =>
                s.timestamp - currentMidnight == d.timestamp - prevMidnight &&
                s.name == d.name
            )
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
        if (task.timestamp == d.timestamp && task.name == d.name) {
          task.completed = true
        }
      })
    }
    return schedule
  }

  buildTaskSchedule(assessments: Assessment[]): Promise<Task[]> {
    let schedule: Task[] = assessments.reduce(
      (list, assessment) =>
        list.concat(
          this.buildTasksForSingleAssessment(assessment, list.length)
        ),
      []
    )
    // NOTE: Check for completed tasks
    if (this.completedTasks)
      schedule = this.updateScheduleWithCompletedTasks(schedule)
    schedule = schedule.sort((a, b) => a.timestamp - b.timestamp)

    console.log('[√] Updated task schedule.')
    return Promise.resolve(schedule)
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

    console.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterTime <= endTime) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskTime = SchedulingService.advanceRepeat(iterTime, {
          unit: repeatQ.unit,
          amount: repeatQ.unitsFromZero[i]
        })

        if (taskTime > today.getTime()) {
          const idx = indexOffset + tmpScheduleAll.length
          const task = this.taskBuilder(idx, assessment, taskTime)
          tmpScheduleAll.push(task)
        }
      }
      iterTime = this.setDateTimeToMidnight(new Date(iterTime)).getTime()
      iterTime = SchedulingService.advanceRepeat(iterTime, repeatP)
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

  static advanceRepeat(timestamp: number, interval: TimeInterval): number {
    return timestamp + this.timeIntervalToMillis(interval)
  }

  static timeIntervalToMillis(interval: TimeInterval): number {
    if (!interval) {
      return TIME_UNIT_MILLIS_DEFAULT
    }
    const unit = interval.unit in TIME_UNIT_MILLIS ? interval.unit : 'day'
    const amount = interval.amount ? interval.amount : 1
    return amount * TIME_UNIT_MILLIS[unit]
  }

  taskBuilder(index, assessment: Assessment, timestamp: number): Task {
    const task: Task = {
      index,
      timestamp,
      completed: false,
      reportedCompletion: false,
      name: assessment.name,
      nQuestions: assessment.questions.length,
      estimatedCompletionTime: assessment.estimatedCompletionTime,
      completionWindow: SchedulingService.computeCompletionWindow(assessment),
      warning: this.localization.chooseText(assessment.warn),
      isClinical: false,
      iconInfo: SchedulingService.findIconInfo(assessment)
    }
    task.notifications = this.notificationService.createNotifications(
      assessment,
      task
    )
    return task
  }

  // looks for icon name for icon type, if not available returns default icon name
  static findIconInfo(assessment: Assessment): string {
    if (assessment.questionnaire.icon) {
      return this.findIconName(assessment.questionnaire.icon);
    }
    return 'checkbox-outline'
  }

  // supports only icon type for now
  static findIconName(icon: IconMetaData): string {
    if (icon.type === 'icon' && icon.value) {
      return icon.value;
    }
    return 'checkbox-outline'
  }

  static computeCompletionWindow(assessment: Assessment): number {
    if (assessment.protocol.completionWindow) {
      return this.timeIntervalToMillis(assessment.protocol.completionWindow)
    } else if (assessment.name === 'ESM') {
      return getMilliseconds({ minutes: 15 })
    } else {
      return getMilliseconds({ days: 1 })
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
