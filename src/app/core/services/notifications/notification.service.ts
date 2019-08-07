import { Injectable } from '@angular/core'

@Injectable()
export class NotificationService {
  init() {
    return undefined
  }
  cancel(): Promise<void> {
    return undefined
  }
  permissionCheck(): Promise<void> {
    return undefined
  }
  publish(limit?: number): Promise<void[]> {
    return undefined
  }
  sendTestNotification(): Promise<void> {
    return undefined
  }
  setLastNotificationUpdate(): Promise<any> {
    return undefined
  }
  getLastNotificationUpdate(): Promise<any> {
    return undefined
  }
}
