import { Injectable } from '@angular/core'

import { DefaultScheduleYearCoverage } from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { Assessment } from '../../../shared/models/assessment'
import { TimeInterval } from '../../../shared/models/protocol'
import { Task } from '../../../shared/models/task'
import { getMilliseconds } from '../../../shared/utilities/time'
import { LocalizationService } from '../misc/localization.service'
import { NotificationGeneratorService } from '../notifications/notification-generator.service'
import { StorageService } from '../storage/storage.service'

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
export class ScheduleGeneratorService {
  tzOffset: number

  constructor(
    private storage: StorageService,
    private notificationService: NotificationGeneratorService,
    private localization: LocalizationService
  ) {
    this.tzOffset = new Date().getTimezoneOffset()
  }

  runScheduler(key, refTimestamp, completedTasks, utcOffsetPrev, assessment?) {
    // NOTE: Check if clinical or not
    const schedule =
      key == StorageKeys.SCHEDULE_TASKS
        ? this.storage
            .get(StorageKeys.CONFIG_ASSESSMENTS)
            .then(assessments =>
              this.buildTaskSchedule(
                assessments,
                completedTasks,
                refTimestamp,
                utcOffsetPrev
              )
            )
            .catch(e => console.error(e))
        : this.storage
            .get(key)
            .then(tasks =>
              this.buildTasksForSingleAssessment(
                tasks,
                assessment,
                refTimestamp,
                true
              )
            )
    return schedule
  }

  buildTaskSchedule(
    assessments: Assessment[],
    completedTasks,
    refTimestamp,
    utcOffsetPrev
  ): Promise<Task[]> {
    let schedule: Task[] = assessments.reduce(
      (list, assessment) =>
        list.concat(
          this.buildTasksForSingleAssessment(
            assessment,
            list.length,
            refTimestamp
          )
        ),
      []
    )
    // NOTE: Check for completed tasks
    if (completedTasks)
      schedule = this.updateScheduleWithCompletedTasks(
        schedule,
        completedTasks,
        utcOffsetPrev
      )
    schedule = schedule.sort((a, b) => a.timestamp - b.timestamp)

    console.log('[√] Updated task schedule.')
    return Promise.resolve(schedule)
  }

  buildTasksForSingleAssessment(
    assessment: Assessment,
    indexOffset: number,
    refTimestamp,
    isClinical?
  ): Task[] {
    const repeatP = !isClinical ? assessment.protocol.repeatProtocol : {}
    const repeatQ = !isClinical
      ? assessment.protocol.repeatQuestionnaire
      : assessment.protocol.clinicalProtocol.repeatAfterClinicVisit

    let iterTime = refTimestamp
    const endTime =
      iterTime + getMilliseconds({ years: DefaultScheduleYearCoverage })

    console.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterTime <= endTime) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskTime = ScheduleGeneratorService.advanceRepeat(iterTime, {
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
      iterTime = ScheduleGeneratorService.advanceRepeat(iterTime, repeatP)
    }

    return tmpScheduleAll
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
      completionWindow: ScheduleGeneratorService.computeCompletionWindow(
        assessment
      ),
      warning: this.localization.chooseText(assessment.warn),
      isClinical: false
    }
    task.notifications = this.notificationService.createNotifications(
      assessment,
      task
    )
    return task
  }

  updateScheduleWithCompletedTasks(
    schedule: Task[],
    completedTasks,
    utcOffsetPrev?
  ): Task[] {
    // NOTE: If utcOffsetPrev exists, timezone has changed
    if (utcOffsetPrev != null) {
      this.storage
        .remove(StorageKeys.SCHEDULE_TASKS_COMPLETED)
        .then(() => {
          const currentMidnight = new Date().setHours(0, 0, 0, 0)
          const prevMidnight =
            new Date().setUTCHours(0, 0, 0, 0) +
            getMilliseconds({ minutes: utcOffsetPrev })
          return completedTasks.map(d => {
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
      completedTasks.forEach(d => {
        const task = schedule[d.index]
        if (task.timestamp == d.timestamp && task.name == d.name) {
          task.completed = true
        }
      })
    }
    return schedule
  }

  addToCompletedTasks(task) {
    return this.storage.push(StorageKeys.SCHEDULE_TASKS_COMPLETED, task)
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

  static timeIntervalToMillis(interval: TimeInterval): number {
    if (!interval) {
      return TIME_UNIT_MILLIS_DEFAULT
    }
    const unit = interval.unit in TIME_UNIT_MILLIS ? interval.unit : 'day'
    const amount = interval.amount ? interval.amount : 1
    return amount * TIME_UNIT_MILLIS[unit]
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

  setDateTimeToMidnight(date: Date): Date {
    // NOTE: To be fixed
    let resetDate: Date
    if (this.tzOffset === date.getTimezoneOffset()) {
      resetDate = new Date(date.setHours(1, 0, 0, 0))
    } else {
      resetDate = new Date(date.setHours(0, 0, 0, 0))
    }
    this.tzOffset = date.getTimezoneOffset()
    return resetDate
  }
}
