import { Injectable } from '@angular/core'

@Injectable()
export abstract class NotificationService {
  abstract init()

  abstract permissionCheck()

  abstract publish(type, limit?, notificationId?)

  abstract setLastNotificationUpdate()

  abstract getLastNotificationUpdate()
}
