import { ConfigService } from '../../../core/services/config/config.service'
import { DefaultNumberOfCompletionLogsToSend } from '../../../../assets/data/defaultConfig'
import { Injectable } from '@angular/core'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { TokenService } from '../../../core/services/token/token.service'
import { UsageService } from '../../../core/services/usage/usage.service'

@Injectable()
export class SplashService {
  constructor(
    private config: ConfigService,
    private token: TokenService,
    private schedule: ScheduleService,
    private usage: UsageService
  ) {}

  evalEnrolment() {
    return this.token.isValid().catch(() => false)
  }

  loadConfig() {
    return this.config.fetchConfigState()
  }

  reset() {
    return this.config.reset()
  }

  sendMissedQuestionnaireLogs() {
    return this.schedule
      .getIncompleteTasks()
      .then(tasks =>
        Promise.all(
          tasks
            .slice(0, DefaultNumberOfCompletionLogsToSend)
            .map(task =>
              this.usage
                .sendCompletionLog(task, 0)
                .then(() => this.schedule.updateTaskToReportedCompletion(task))
            )
        )
      )
  }
}
