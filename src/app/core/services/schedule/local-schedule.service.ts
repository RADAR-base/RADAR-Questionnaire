import { Injectable } from '@angular/core'

import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { Task } from '../../../shared/models/task'
import { compareTasks } from '../../../shared/utilities/compare-tasks'
import {
  getMilliseconds,
  setDateTimeToMidnightEpoch
} from '../../../shared/utilities/time'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { ScheduleGeneratorService } from './schedule-generator.service'
import { ScheduleService } from './schedule.service'

@Injectable()
export class LocalScheduleService extends ScheduleService {
  constructor(
    private store: StorageService,
    logger: LogService,
    private scheduleGenerator: ScheduleGeneratorService
  ) {
    super(store, logger)
  }

  init() {}

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
    return this.getCompletedTasks()
      .then(completedTasks => {
        return this.scheduleGenerator.runScheduler(
          referenceTimestamp,
          completedTasks,
          utcOffsetPrev
        )
      })
      .then(res =>
        Promise.all([
          this.setTasks(AssessmentType.SCHEDULED, res.schedule),
          this.setCompletedTasks(res.completed ? res.completed : [])
        ])
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
}
