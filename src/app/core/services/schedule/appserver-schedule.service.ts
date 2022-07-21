import {} from './notification.service'

import { Injectable } from '@angular/core'

import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import {
  getMilliseconds,
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

  getTasksForDate(date: Date, type: AssessmentType) {
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
    return Promise.all([this.appServer.init(), this.getCompletedTasks()]).then(
      ([, completedTasks]) => {
        return this.appServer
          .getSchedule()
          .then(tasks =>
            tasks.map(t => this.mapTaskDTO(t, AssessmentType.SCHEDULED))
          )
          .then((schedule: Task[]) => {
            console.log(schedule)
            // TODO: Check for completed tasks
            return schedule
          })
      }
    )
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
          timestamp: getMilliseconds({ seconds: task.timestamp }),
          nQuestions: assessment.questions.length,
          warning: this.localization.chooseText(assessment.warn),
          requiresInClinicCompletion: assessment.requiresInClinicCompletion,
          notifications: []
        })
        return newTask
      })
  }
}
