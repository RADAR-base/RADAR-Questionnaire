import { Injectable } from '@angular/core'

@Injectable()
export class NotificationService {
  init() {
    return undefined
  }
  cancelAllNotifications(user): Promise<any> {
    return undefined
  }
  permissionCheck(): Promise<void> {
    return undefined
  }
  publish(type, limit?, notificationId?): Promise<any> {
    return undefined
  }

  setLastNotificationUpdate(): Promise<any> {
    return undefined
  }
  getLastNotificationUpdate(): Promise<any> {
    return undefined
  }
}
