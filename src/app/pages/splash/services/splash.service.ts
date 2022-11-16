import { Injectable } from '@angular/core'

import { DefaultNumberOfCompletionLogsToSend } from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { NotificationService } from '../../../core/services/notifications/notification.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { TokenService } from '../../../core/services/token/token.service'
import { UsageService } from '../../../core/services/usage/usage.service'

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
  ) {}

  evalEnrolment() {
    return this.token
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
      .then(() => this.token.isValid().catch(() => false))
  }

  isEnrolled() {
    return this.token.getTokens().then(tokens => !!tokens)
  }

  loadConfig() {
    return this.token
      .refresh()
      .then(() => this.notificationService.init())
      .then(() => this.notificationService.permissionCheck())
      .then(() => this.schedule.init())
      .then(() => this.config.fetchConfigState())
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
