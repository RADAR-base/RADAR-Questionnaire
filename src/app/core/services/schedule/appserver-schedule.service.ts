import { Injectable } from '@angular/core'
import * as moment from 'moment'

import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { TaskState } from '../../../shared/models/protocol'
import { Task } from '../../../shared/models/task'
import {
  advanceRepeat,
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
    private questionnaire: QuestionnaireService
  ) {
    super(store, logger)
  }

  init() {}

  getTasksForDate(date: Date, type: AssessmentType) {
    const startTime = setDateTimeToMidnight(date)
    const endTime = moment(startTime).add(1, 'days').toDate()
    return this.appServer
      .getScheduleForDates(startTime, endTime)
      .then(tasks =>
        Promise.all<Task>(
          tasks.map(t => this.mapTaskDTO(t, AssessmentType.SCHEDULED))
        ).then(res => this.setTasks(AssessmentType.SCHEDULED, res))
      )
  }

  generateSchedule(referenceTimestamp, utcOffsetPrev) {
    this.logger.log('Updating schedule..', referenceTimestamp)
    return Promise.all([this.appServer.init(), this.getCompletedTasks()]).then(
      ([, completedTasks]) => {
        return this.appServer
          .getSchedule()
          .then(tasks =>
            Promise.all<Task>(
              tasks.map(t => this.mapTaskDTO(t, AssessmentType.SCHEDULED))
            )
          )
          .then(res => this.setTasks(AssessmentType.SCHEDULED, res))
      }
    )
  }

  updateTaskToComplete(updatedTask): Promise<any> {
    return this.appServer
      .updateTaskState(updatedTask.id, TaskState.COMPLETED)
      .then(() => super.updateTaskToReportedCompletion(updatedTask))
      .catch(() => super.updateTaskToComplete(updatedTask))
  }

  generateSingleAssessmentTask(
    assessment: Assessment,
    assessmentType,
    referenceDate: number
  ) {
    return
  }

  mapTaskDTO(task: Task, assesmentType: AssessmentType): Promise<Task> {
    return this.questionnaire
      .getAssessmentForTask(assesmentType, task)
      .then(assessment => {
        const newTask = Object.assign(task, {
          reportedCompletion: !!task.completed,
          nQuestions: assessment.questions.length,
          warning: this.localization.chooseText(assessment.warn),
          requiresInClinicCompletion: assessment.requiresInClinicCompletion,
          notifications: []
        })
        return newTask
      })
  }
}
