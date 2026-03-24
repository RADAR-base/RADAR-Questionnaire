import { Injectable } from '@angular/core'

import { DefaultNumberOfCompletionLogsToSend } from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { NotificationService } from '../../../core/services/notifications/notification.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { TokenService } from '../../../core/services/token/token.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { withTimeout, withTimeoutAndDefault } from '../../../shared/utilities/timeout-promise'

const TIMEOUT = {
  STORAGE: 10_000,
  TOKEN_REFRESH: 30_000,
  NOTIFICATION_INIT: 15_000,
  PERMISSION_CHECK: 10_000,
  SCHEDULE_INIT: 15_000,
  CONFIG_FETCH: 60_000,
  EVAL_ENROLMENT: 45_000,
}

@Injectable({
  providedIn: 'root'
})
export class SplashService {
  INVALID_USER_ERROR = 'was not found in the database'
  constructor(
    private config: ConfigService,
    private token: TokenService,
    private schedule: ScheduleService,
    private usage: UsageService,
    private notificationService: NotificationService
  ) { }

  evalEnrolment() {
    return withTimeout(
      this.token
        .refresh()
        .catch(e => {
          if (e.status == 401) {
            if (
              e.error.error_description &&
              e.error.error_description.includes(this.INVALID_USER_ERROR)
            )
              return this.token.setTokens(null)
          } else return
        })
        .then(() => this.token.isValid().catch(() => false)),
      TIMEOUT.EVAL_ENROLMENT,
      'evalEnrolment'
    ).catch(e => {
      console.warn('[SPLASH] evalEnrolment failed, treating as invalid:', e.message || e)
      return false
    })
  }

  isEnrolled() {
    return withTimeoutAndDefault(
      this.token.getTokens().then(tokens => !!tokens),
      TIMEOUT.STORAGE,
      false,
      'isEnrolled'
    )
  }

  loadConfig() {
    return withTimeout(
      this.token.refresh(),
      TIMEOUT.TOKEN_REFRESH,
      'token.refresh'
    )
      .then(() => withTimeoutAndDefault(
        this.notificationService.init(),
        TIMEOUT.NOTIFICATION_INIT,
        undefined,
        'notification.init'
      ))
      .then(() => withTimeoutAndDefault(
        this.notificationService.permissionCheck(),
        TIMEOUT.PERMISSION_CHECK,
        undefined,
        'notification.permissionCheck'
      ))
      .then(() => withTimeoutAndDefault(
        this.schedule.init(),
        TIMEOUT.SCHEDULE_INIT,
        undefined,
        'schedule.init'
      ))
      .then(() => withTimeout(
        this.config.fetchConfigState(),
        TIMEOUT.CONFIG_FETCH,
        'config.fetchConfigState'
      ))
  }

  isAppUpdateAvailable() {
    return this.config.checkForAppUpdates()
  }

  reset() {
    return this.config.resetAll()
  }

  sendMissedQuestionnaireLogs() {
    return this.schedule.getIncompleteTasks().then(tasks =>
      Promise.all(
        tasks
          .filter(t => !t.reportedCompletion)
          .slice(0, DefaultNumberOfCompletionLogsToSend)
          .map(task =>
            this.usage
              .sendCompletionLog(task, 0)
              .then(() => this.schedule.updateTaskToReportedCompletion(task))
          )
      )
    )
  }

  sendReportedIncompleteTasks() {
    return this.schedule
      .getReportedIncompleteTasks()
      .then(tasks =>
        Promise.all(tasks.map(task => this.schedule.updateTaskToComplete(task)))
      )
  }
}
