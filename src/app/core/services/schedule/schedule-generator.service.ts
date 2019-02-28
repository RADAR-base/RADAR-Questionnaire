import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultScheduleYearCoverage,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { Assessment } from '../../../shared/models/assessment'
import { TimeInterval } from '../../../shared/models/protocol'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import { TaskType } from '../../../shared/utilities/task-type'
import { getMilliseconds } from '../../../shared/utilities/time'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LocalizationService } from '../misc/localization.service'
import { NotificationGeneratorService } from '../notifications/notification-generator.service'

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
    private notificationService: NotificationGeneratorService,
    private localization: LocalizationService,
    private questionnaire: QuestionnaireService
  ) {
    this.tzOffset = new Date().getTimezoneOffset()
  }

  runScheduler(type, refTimestamp, completedTasks, utcOffsetPrev, assessment?) {
    // NOTE: Check if clinical or regular
    switch (type) {
      case TaskType.NON_CLINICAL:
        return this.questionnaire
          .getAssessments(type)
          .then(assessments =>
            this.buildTaskSchedule(
              assessments,
              completedTasks,
              refTimestamp,
              utcOffsetPrev
            )
          )
          .catch(e => console.error(e))
      case TaskType.CLINICAL:
        return this.questionnaire.getAssessments(type).then(tasks =>
          Promise.resolve({
            schedule: this.buildTasksForSingleAssessment(
              tasks,
              assessment,
              refTimestamp,
              TaskType.CLINICAL
            ),
            completed: [] as Task[]
          })
        )
    }
    return Promise.reject([])
  }

  buildTaskSchedule(
    assessments: Assessment[],
    completedTasks,
    refTimestamp,
    utcOffsetPrev
  ): Promise<{ schedule: Task[]; completed: Task[] }> {
    let schedule: Task[] = assessments.reduce(
      (list, assessment) =>
        list.concat(
          this.buildTasksForSingleAssessment(
            assessment,
            list.length,
            refTimestamp,
            TaskType.NON_CLINICAL
          )
        ),
      []
    )
    // NOTE: Check for completed tasks
    const res = this.updateScheduleWithCompletedTasks(
      schedule,
      completedTasks,
      utcOffsetPrev
    )
    schedule = res.schedule.sort(compareTasks)

    console.log('[√] Updated task schedule.')
    return Promise.resolve({ schedule, completed: res.updatedCompletedTasks })
  }

  getRepeatProtocol(protocol, type) {
    let repeatP, repeatQ
    switch (type) {
      case TaskType.CLINICAL:
        repeatP = {}
        repeatQ = protocol.clinicalProtocol.repeatAfterClinicVisit
      default:
        repeatP = protocol.repeatProtocol
        repeatQ = protocol.repeatQuestionnaire
    }
    return { repeatP, repeatQ }
  }

  buildTasksForSingleAssessment(
    assessment: Assessment,
    indexOffset: number,
    refTimestamp,
    type: TaskType
  ): Task[] {
    const { repeatP, repeatQ } = this.getRepeatProtocol(
      assessment.protocol,
      type
    )
    let iterTime = refTimestamp
    const endTime =
      iterTime + getMilliseconds({ years: DefaultScheduleYearCoverage })
    const completionWindow = ScheduleGeneratorService.computeCompletionWindow(
      assessment
    )
    console.log(assessment)

    const today = this.setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterTime <= endTime) {
      for (let i = 0; i < repeatQ.unitsFromZero.length; i++) {
        const taskTime = ScheduleGeneratorService.advanceRepeat(iterTime, {
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
      iterTime = ScheduleGeneratorService.advanceRepeat(iterTime, repeatP)
    }

    return tmpScheduleAll
  }

  taskBuilder(
    index,
    assessment: Assessment,
    timestamp: number,
    completionWindow
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
      isClinical: assessment.protocol.clinicalProtocol ? true : false
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
  ) {
    const completed = []
    if (completedTasks) {
      // NOTE: If utcOffsetPrev exists, timezone has changed
      const currentMidnight = new Date().setHours(0, 0, 0, 0)
      const prevMidnight =
        new Date().setUTCHours(0, 0, 0, 0) +
        getMilliseconds({ minutes: utcOffsetPrev })
      return completedTasks.map(d => {
        const finishedToday = schedule.find(
          s =>
            ((utcOffsetPrev != null &&
              s.timestamp - currentMidnight == d.timestamp - prevMidnight) ||
              (utcOffsetPrev == null && s.timestamp == d.timestamp)) &&
            s.name == d.name
        )
        if (finishedToday !== undefined) {
          finishedToday.completed = true
          finishedToday.reportedCompletion = d.reportedCompletion
          return completed.push(finishedToday)
        }
      })
    }
    return { schedule, completed }
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
      return DefaultESMCompletionWindow
    } else {
      return DefaultTaskCompletionWindow
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
