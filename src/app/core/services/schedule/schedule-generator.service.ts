// tslint:disable: prefer-const
import { Injectable } from '@angular/core'

import {
  DefaultScheduleYearCoverage,
  DefaultTask,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import {
  Assessment,
  AssessmentType,
  SchedulerResult
} from '../../../shared/models/assessment'
import { ReferenceTimestampFormat } from '../../../shared/models/protocol'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import {
  advanceRepeat,
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch,
  timeIntervalToMillis
} from '../../../shared/utilities/time'
import { Utility } from '../../../shared/utilities/util'
import { QuestionnaireService } from '../config/questionnaire.service'
import { RemoteConfigService } from '../config/remote-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { NotificationGeneratorService } from '../notifications/notification-generator.service'

@Injectable()
export class ScheduleGeneratorService {
  SCHEDULE_YEAR_COVERAGE = DefaultScheduleYearCoverage
  REFERENCE_TIMESTAMP_FORMAT = 'DD-MM-YYYY:hh:mm'

  constructor(
    private notificationService: NotificationGeneratorService,
    private localization: LocalizationService,
    private questionnaire: QuestionnaireService,
    private remoteConfig: RemoteConfigService,
    private logger: LogService,
    private util: Utility
  ) {}

  runScheduler(
    refTimestamp,
    completedTasks: Task[],
    utcOffsetPrev
  ): Promise<SchedulerResult> {
    return Promise.all([
      this.questionnaire.getAssessments(AssessmentType.SCHEDULED),
      this.fetchScheduleYearCoverage()
    ]).then(([assessments]) => {
      const schedule: Task[] = assessments.reduce(
        (list: Task[], assessment) => {
          const tasks = this.buildTasksForSingleAssessment(
            assessment,
            list.length,
            refTimestamp,
            AssessmentType.SCHEDULED
          )
          return list.concat(tasks)
        },
        []
      )
      // NOTE: Check for completed tasks
      const res = this.updateScheduleWithCompletedTasks(
        schedule,
        completedTasks,
        utcOffsetPrev
      )
      this.logger.log('[√] Updated task schedule.')
      return Promise.resolve({
        schedule: res.schedule.sort(compareTasks),
        completed: res.completed
      })
    })
  }

  getProtocolValues(protocol, type, defaultRefTime) {
    // repeatProtocol/repeatP - This repeats the protocol until the end of the year coverage (default: 3 years).
    // - This specifices the reference timestamp from which to generate the individual tasks.
    // repeatQuestionnaire/repeatQ - The child protocol which specifies the individual task time based on the
    // reference timestamp generated by the repeatProtocol.
    // refTime - The reference timestamp from which to generate the schedule (default: midnight of enrolment date).
    // endTime - The timestamp until which to generate the schedule.
    let repeatP, repeatQ, completionWindow, refTime, endTime

    switch (type) {
      case AssessmentType.CLINICAL:
        repeatQ = protocol.clinicalProtocol.repeatAfterClinicVisit
        break
      default:
        repeatP = protocol.repeatProtocol
        repeatQ = protocol.repeatQuestionnaire
    }
    completionWindow = protocol.completionWindow
      ? timeIntervalToMillis(protocol.completionWindow)
      : DefaultTaskCompletionWindow
    refTime = this.getReferenceTimestamp(
      protocol.referenceTimestamp,
      defaultRefTime
    )
    endTime = advanceRepeat(refTime, {
      unit: 'year',
      amount: this.getScheduleYearCoverage()
    })
    return { repeatP, repeatQ, completionWindow, refTime, endTime }
  }

  buildTasksForSingleAssessment(
    assessment: Assessment,
    indexOffset: number,
    refTimestamp,
    type: AssessmentType
  ): Task[] {
    // This generates an array of tasks from a single assessment and protocol.
    const tasks: Task[] = []
    const today = setDateTimeToMidnightEpoch(new Date())
    let {
      repeatP,
      repeatQ,
      completionWindow,
      refTime,
      endTime
    } = this.getProtocolValues(assessment.protocol, type, refTimestamp)

    while (refTime <= endTime) {
      repeatQ.unitsFromZero.map(amount => {
        const taskTime = advanceRepeat(refTime, {
          unit: repeatQ.unit,
          amount: amount
        })
        const task = this.taskBuilder(
          indexOffset + tasks.length,
          assessment,
          taskTime,
          completionWindow
        )
        tasks.push(task)
      })
      if (!repeatP) break
      refTime = advanceRepeat(refTime, repeatP)
    }
    return tasks.filter(t => t.timestamp + t.completionWindow > today)
  }

  taskBuilder(
    index,
    assessment: Assessment,
    timestamp: number,
    completionWindow
  ): Task {
    const task: Task = this.util.deepCopy(DefaultTask)
    task.index = index
    task.timestamp = timestamp
    task.name = assessment.name
    task.type = assessment.type
    task.nQuestions = assessment.questions.length
    task.estimatedCompletionTime = assessment.estimatedCompletionTime
    task.completionWindow = completionWindow
    task.warning = this.localization.chooseText(assessment.warn)
    task.requiresInClinicCompletion = assessment.requiresInClinicCompletion
    task.showInCalendar = this.getOrDefault(
      assessment.showInCalendar,
      task.showInCalendar
    )
    task.isDemo = this.getOrDefault(assessment.isDemo, task.isDemo)
    task.order = this.getOrDefault(assessment.order, task.order)
    task.notifications = this.notificationService.createNotifications(
      assessment,
      task
    )
    return task
  }

  getOrDefault(val, defaultVal) {
    if (val == null) return defaultVal
    return val
  }

  updateScheduleWithCompletedTasks(
    schedule: Task[],
    completedTasks,
    utcOffsetPrev?
  ): SchedulerResult {
    const completed = []
    if (completedTasks && completedTasks.length > 0) {
      // NOTE: If utcOffsetPrev exists, timezone has changed
      const currentMidnight = setDateTimeToMidnightEpoch(new Date())
      const prevMidnight = advanceRepeat(currentMidnight, {
        unit: 'min',
        amount: utcOffsetPrev
      })
      completedTasks.map(d => {
        const task = schedule.find(
          s =>
            ((utcOffsetPrev != null &&
              s.timestamp - currentMidnight == d.timestamp - prevMidnight) ||
              (utcOffsetPrev == null && s.timestamp == d.timestamp)) &&
            s.name == d.name
        )
        if (task !== undefined) {
          task.completed = true
          task.reportedCompletion = d.reportedCompletion
          task.timeCompleted = d.timeCompleted
          return completed.push(task)
        }
      })
    }
    return { schedule, completed }
  }

  getReferenceTimestamp(refTimestamp, defaultRefTimestamp) {
    // NOTE: Get initial timestamp to start schedule generation from
    if (refTimestamp && refTimestamp.format) {
      switch (refTimestamp.format) {
        case ReferenceTimestampFormat.DATE:
        case ReferenceTimestampFormat.DATETIME:
        case ReferenceTimestampFormat.DATETIMEUTC:
          return this.localization
            .moment(refTimestamp.timestamp)
            .toDate()
            .getTime()
        case ReferenceTimestampFormat.NOW:
          return Date.now()
        case ReferenceTimestampFormat.TODAY:
          return setDateTimeToMidnightEpoch(new Date())
      }
    } else if (refTimestamp) {
      // Keeps support for previous configuration
      return setDateTimeToMidnightEpoch(
        this.localization
          .moment(refTimestamp, this.REFERENCE_TIMESTAMP_FORMAT)
          .toDate()
      )
    } else return defaultRefTimestamp
  }

  getScheduleYearCoverage() {
    if (this.SCHEDULE_YEAR_COVERAGE > 0) return this.SCHEDULE_YEAR_COVERAGE
    else return DefaultScheduleYearCoverage
  }

  fetchScheduleYearCoverage() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.SCHEDULE_YEAR_COVERAGE,
          DefaultScheduleYearCoverage.toString()
        )
      )
      .then(coverage => (this.SCHEDULE_YEAR_COVERAGE = parseFloat(coverage)))
      .catch(e => {
        throw this.logger.error('Failed to fetch Firebase config', e)
      })
  }
}
