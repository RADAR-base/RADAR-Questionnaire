import { Injectable } from '@angular/core'

import {
  DefaultESMCompletionWindow,
  DefaultScheduleYearCoverage,
  DefaultTaskCompletionWindow
} from '../../../../assets/data/defaultConfig'
import { Assessment } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import { TaskType } from '../../../shared/utilities/task-type'
import {
  advanceRepeat,
  getMilliseconds,
  setDateTimeToMidnight,
  timeIntervalToMillis
} from '../../../shared/utilities/time'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { NotificationGeneratorService } from '../notifications/notification-generator.service'

@Injectable()
export class ScheduleGeneratorService {
  constructor(
    private notificationService: NotificationGeneratorService,
    private localization: LocalizationService,
    private questionnaire: QuestionnaireService,
    private logger: LogService,
  ) {}

  runScheduler(
    type,
    refTimestamp,
    completedTasks,
    utcOffsetPrev,
    assessment?,
    indexOffset?
  ) {
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
          .catch(e => { this.logger.error('Failed to schedule assessement', e) })
      case TaskType.CLINICAL:
        return Promise.resolve({
          schedule: this.buildTasksForSingleAssessment(
            assessment,
            indexOffset,
            refTimestamp,
            TaskType.CLINICAL
          ),
          completed: [] as Task[]
        })
    }
    return Promise.resolve()
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

    this.logger.log('[√] Updated task schedule.')
    return Promise.resolve({ schedule, completed: res.completed })
  }

  getRepeatProtocol(protocol, type) {
    let repeatP, repeatQ
    switch (type) {
      case TaskType.CLINICAL:
        repeatQ = protocol.clinicalProtocol.repeatAfterClinicVisit
        break
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
    const today = setDateTimeToMidnight(new Date())
    const tmpScheduleAll: Task[] = []
    while (iterTime <= endTime) {
      repeatQ.unitsFromZero.map(amount => {
        const taskTime = advanceRepeat(iterTime, {
          unit: repeatQ.unit,
          amount: amount
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
      })
      iterTime = setDateTimeToMidnight(new Date(iterTime)).getTime()
      if (!repeatP) break
      iterTime = advanceRepeat(iterTime, repeatP)
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
      isClinical: !!assessment.protocol.clinicalProtocol ? true : false,
      iconInfo: this.getIconInfo(assessment)
    }
    task.notifications = this.notificationService.createNotifications(
      assessment,
      task
    )
    return task
  }

  getIconInfo(assessment: Assessment) {
    if (assessment && assessment.questionnaire && assessment.questionnaire.icon && assessment.questionnaire.icon.name) {
      return assessment.questionnaire.icon.name
    }
    else {
      return 'checkbox'
    }
  }

  updateScheduleWithCompletedTasks(
    schedule: Task[],
    completedTasks,
    utcOffsetPrev?
  ): { schedule: any[]; completed: any[] } {
    const completed = []
    if (completedTasks && completedTasks.length > 0) {
      // NOTE: If utcOffsetPrev exists, timezone has changed
      const currentMidnight = new Date().setHours(0, 0, 0, 0)
      const prevMidnight =
        new Date().setUTCHours(0, 0, 0, 0) +
        getMilliseconds({ minutes: utcOffsetPrev })
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

  static computeCompletionWindow(assessment: Assessment): number {
    if (assessment.protocol.completionWindow) {
      return timeIntervalToMillis(assessment.protocol.completionWindow)
    } else if (assessment.name === 'ESM') {
      return DefaultESMCompletionWindow
    } else {
      return DefaultTaskCompletionWindow
    }
  }
}
