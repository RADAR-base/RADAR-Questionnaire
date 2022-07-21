import { Injectable } from '@angular/core'

import { DefaultScheduleServiceType } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { SchedulerType } from '../../../shared/models/notification-handler'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { AppserverScheduleService } from './appserver-schedule.service'
import { LocalScheduleService } from './local-schedule.service'
import { ScheduleService } from './schedule.service'

@Injectable()
export class ScheduleFactoryService extends ScheduleService {
  scheduleService: ScheduleService

  constructor(
    public localScheduleService: LocalScheduleService,
    public appServerScheduleSerice: AppserverScheduleService,
    private remoteConfig: RemoteConfigService,
    private store: StorageService,
    logger: LogService
  ) {
    super(store, logger)
  }

  init() {
    return this.remoteConfig
      .forceFetch()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.SCHEDULE_SERVICE_TYPE,
          DefaultScheduleServiceType
        )
      )
      .then(type => {
        type = SchedulerType.LOCAL
        switch (type) {
          case SchedulerType.LOCAL:
            return (this.scheduleService = this.localScheduleService)
          case SchedulerType.APPSERVER:
            return (this.scheduleService = this.appServerScheduleSerice)
          default:
            throw new Error('No such scheduling service available')
        }
      })
  }

  generateSchedule(referenceTimestamp, utcOffsetPrev) {
    return this.scheduleService.generateSchedule(
      referenceTimestamp,
      utcOffsetPrev
    )
  }

  generateSingleAssessmentTask(
    assessment: Assessment,
    assessmentType,
    referenceDate: number
  ) {
    return this.generateSingleAssessmentTask(
      assessment,
      assessmentType,
      referenceDate
    )
  }

  getTasksForDate(date: Date, type: AssessmentType) {
    return this.getTasksForDate(date, type)
  }
}
