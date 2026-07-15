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

  getTasksForDate(date: Date, type: AssessmentType) {
    const startTime = setDateTimeToMidnight(date)
    const endTime = moment(startTime).add(1, 'days').toDate()

    return this.appServer
      .getScheduleForDates(startTime, endTime)
      .then(tasks => {
        if (tasks == null || !tasks.length) {
          return this.getLocalTasksForDate(date, type)
        }
        return Promise.all<Task>(
          tasks.map(t => this.mapTaskDTO(t, type))
        )
      })
      .catch(e => {
        this.logger.error('Failed to pull tasks from appserver', e)
        return this.getLocalTasksForDate(date, type)
      })
  }

  getLocalTasksForDate(date: Date, type: AssessmentType) {
    return this.getTasks(type).then(schedule => {
      const startTime = setDateTimeToMidnightEpoch(date)
      const endTime = startTime + getMilliseconds({ days: 1 })
      return schedule
        ? schedule.filter(d => {
            return (
              d.timestamp + d.completionWindow > startTime &&
              d.timestamp < endTime
            )
          })
        : []
    })
  }

  generateSchedule(referenceTimestamp, utcOffsetPrev) {
    this.logger.log('Updating schedule..', referenceTimestamp)
    return this.getCompletedTasks().then(completedTasks => {
      return this.appServer
        .getSchedule()
        .then(tasks =>
          Promise.all<Task>(
            tasks.map(t => this.mapTaskDTO(t, AssessmentType.SCHEDULED))
          )
        )
        .then(mappedTasks => {
          const completed = mappedTasks.filter(t => t.completed)
          return Promise.all([
            this.setTasks(AssessmentType.SCHEDULED, mappedTasks),
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
