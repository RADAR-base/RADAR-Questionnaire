import { Injectable } from '@angular/core'
import * as moment from 'moment'

import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { TaskState } from '../../../shared/models/protocol'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import {
  getMilliseconds,
  setDateTimeToMidnight,
  setDateTimeToMidnightEpoch
} from '../../../shared/utilities/time'
import { AppServerService } from '../app-server/app-server.service'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'
import { ScheduleService } from './schedule.service'

@Injectable()
export class AppserverScheduleService extends ScheduleService {
  constructor(
    private store: StorageService,
    logger: LogService,
    private appServer: AppServerService,
    private localization: LocalizationService,
    private questionnaire: QuestionnaireService,
    private scheduleGenerator: ScheduleGeneratorService
  ) {
    super(store, logger)
  }

  init() {
    return this.appServer.init()
  }

  private readonly FETCH_TASKS_TIMEOUT_MS = 8000

  getTasksForDate(date: Date, type: AssessmentType) {
    const startTime = setDateTimeToMidnight(date)
    const endTime = moment(startTime).add(1, 'days').toDate()

    const fetchFromServer = this.appServer
      .getScheduleForDates(startTime, endTime)
      .then(tasks => {
        if (tasks == null || !tasks.length) {
          return this.getLocalTasksForDate(date, type)
        }
        return Promise.all<Task>(
          tasks.map(t => this.mapTaskDTO(t, t.type || type))
        ).then(mappedTasks => {
          // Cache fetched tasks into local storage so they survive offline restarts.
          // Group by type and merge with existing local tasks per type.
          this.cacheTasksByType(mappedTasks)
          return mappedTasks
        })
      })

    // Race against a timeout — fall back to cache if appserver is slow
    const timeout = new Promise<Task[]>((_, reject) =>
      setTimeout(() => reject(new Error('Appserver fetch timed out')), this.FETCH_TASKS_TIMEOUT_MS)
    )

    return Promise.race([fetchFromServer, timeout])
      .catch(e => {
        this.logger.error('Failed to pull tasks from appserver', e)
        return this.getLocalTasksForDate(date, type)
      })
  }

  getLocalTasksForDate(date: Date, type: AssessmentType) {
    const startTime = setDateTimeToMidnightEpoch(date)
    const endTime = startTime + getMilliseconds({ days: 1 })
    const filterByDate = (tasks: Task[]) =>
      (tasks || []).filter(
        d => d.timestamp + d.completionWindow > startTime && d.timestamp < endTime
      )
    // Return both scheduled and triggered tasks from local cache
    return Promise.all([
      this.getTasks(AssessmentType.SCHEDULED),
      this.getTasks(AssessmentType.TRIGGERED)
    ]).then(([scheduled, triggered]) =>
      filterByDate(scheduled).concat(filterByDate(triggered))
    )
  }

  generateSchedule(referenceTimestamp, utcOffsetPrev) {
    this.logger.log('Updating schedule..', referenceTimestamp)
    return this.getCompletedTasks().then(completedTasks => {
      return this.appServer
        .getSchedule()
        .then(tasks =>
          Promise.all<Task>(
            tasks.map(t => this.mapTaskDTO(t, t.type || AssessmentType.SCHEDULED))
          )
        )
        .then(mappedTasks => {
          const scheduled = mappedTasks.filter(t => t.type !== AssessmentType.TRIGGERED)
          const triggered = mappedTasks.filter(t => t.type === AssessmentType.TRIGGERED)
          const completed = mappedTasks.filter(t => t.completed)
          return Promise.all([
            this.setTasks(AssessmentType.SCHEDULED, scheduled),
            this.setTasks(AssessmentType.TRIGGERED, triggered),
            this.setCompletedTasks(completed)
          ])
        })
    })
  }

  updateTaskToComplete(updatedTask): Promise<any> {
    return this.appServer
      .updateTaskState(updatedTask.id, TaskState.COMPLETED)
      .then(
        () =>
          super
            .updateTaskToComplete(updatedTask)
            .then(() => super.updateTaskToReportedCompletion(updatedTask)),
        () => super.updateTaskToComplete(updatedTask)
      )
  }

  generateSingleAssessmentTask(
    assessment: Assessment,
    assessmentType,
    referenceDate: number
  ) {
    return this.getTasks(assessmentType).then((tasks: Task[]) => {
      const schedule = this.scheduleGenerator.buildTasksForSingleAssessment(
        assessment,
        tasks ? tasks.length : 0,
        referenceDate,
        assessmentType
      )
      const newTasks = (tasks ? tasks.concat(schedule) : schedule).sort(
        compareTasks
      )
      this.changeDetectionEmitter.emit()
      return this.setTasks(assessmentType, newTasks)
    })
  }

  private cacheTasksByType(tasks: Task[]) {
    const grouped = new Map<AssessmentType, Task[]>()
    for (const t of tasks) {
      const type = t.type || AssessmentType.SCHEDULED
      if (!grouped.has(type)) grouped.set(type, [])
      grouped.get(type).push(t)
    }
    grouped.forEach((fetched, type) => {
      this.getTasks(type).then(existing => {
        const fetchedKeys = new Set(
          fetched.map(t => t.timestamp + '-' + t.name)
        )
        const kept = (existing || []).filter(
          t => !fetchedKeys.has(t.timestamp + '-' + t.name)
        )
        this.setTasks(type, kept.concat(fetched)).catch(() => {})
      }).catch(() => {})
    })
  }

  mapTaskDTO(task: Task, assessmentType: AssessmentType): Promise<Task> {
    return this.questionnaire
      .getAssessmentForTask(assessmentType, task)
      .then(assessment => {
        return Object.assign({}, task, {
          completed: !!task.completed,
          reportedCompletion: !!task.completed,
          nQuestions: assessment ? assessment.questions.length : 1,
          warning: assessment
            ? this.localization.chooseText(assessment.warn)
            : '',
          requiresInClinicCompletion: assessment
            ? assessment.requiresInClinicCompletion
            : false,
          notifications: []
        })
      })
  }
}
