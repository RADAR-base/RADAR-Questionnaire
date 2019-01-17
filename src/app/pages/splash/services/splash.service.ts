import { Injectable } from '@angular/core'

import {
  DefaultNotificationRefreshTime,
  DefaultNumberOfNotificationsToSchedule
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config.service'
import { NotificationService } from '../../../core/services/notification.service'
import { StorageService } from '../../../core/services/storage.service'
import { UsageService } from '../../../core/services/usage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class SplashService {
  constructor(
    public storage: StorageService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private usage: UsageService
  ) {}

  evalEnrolment() {
    return this.storage.get(StorageKeys.PARTICIPANTLOGIN)
  }

  sendOpenEvent() {
    return this.usage.sendOpen(new Date().getTime() / 1000)
  }

  checkTimezoneChange() {
    return this.storage.get(StorageKeys.UTC_OFFSET).then(prevUtcOffset => {
      const utcOffset = new Date().getTimezoneOffset()
      // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
      if (prevUtcOffset !== utcOffset) {
        console.log(
          '[SPLASH] Timezone has changed to ' +
            utcOffset +
            '. Cancelling notifications! Rescheduling tasks! Scheduling new notifications!'
        )
        return this.storage
          .set(StorageKeys.UTC_OFFSET, utcOffset)
          .then(() =>
            this.storage.set(StorageKeys.UTC_OFFSET_PREV, prevUtcOffset)
          )
          .then(() => this.configService.updateConfigStateOnTimezoneChange())
      } else {
        console.log('[SPLASH] Current Timezone is ' + utcOffset)
      }
    })
  }

  notificationsRefresh() {
    // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
    return this.storage
      .get(StorageKeys.LAST_NOTIFICATION_UPDATE)
      .then(lastUpdate => {
        const timeElapsed = Date.now() - lastUpdate
        if (timeElapsed > DefaultNotificationRefreshTime || !lastUpdate) {
          console.log('[SPLASH] Scheduling Notifications.')
          return this.notificationService.setNextXNotifications(
            DefaultNumberOfNotificationsToSchedule
          )
        } else {
          console.log(
            'Not Scheduling Notifications as ' +
              timeElapsed +
              'ms from last refresh is not greater than the default Refresh interval of ' +
              DefaultNotificationRefreshTime
          )
        }
      })
  }
}
