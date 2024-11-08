import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'

@Injectable({
  providedIn: 'root'
})
export abstract class NotificationService {
  private readonly NOTIFICATION_STORAGE = {
    LAST_NOTIFICATION_UPDATE: StorageKeys.LAST_NOTIFICATION_UPDATE,
    NOTIFICATION_MESSAGING_TYPE: StorageKeys.NOTIFICATION_MESSAGING_TYPE
  }
  constructor(public storage: StorageService) {}

  abstract init()

  abstract permissionCheck()

  abstract publish(type, limit?, notificationId?)

  abstract unregisterFromNotifications(): Promise<any>

  setLastNotificationUpdate(timestamp): Promise<void> {
    return this.storage.set(
      this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE,
      timestamp
    )
  }

  getLastNotificationUpdate() {
    return this.storage.get(this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE)
  }

  getNotificationMessagingType() {
    return this.storage.get(
      this.NOTIFICATION_STORAGE.NOTIFICATION_MESSAGING_TYPE
    )
  }

  setNotificationMessagingType(type) {
    return this.storage.set(StorageKeys.NOTIFICATION_MESSAGING_TYPE, type)
  }

  reset() {
    return this.setLastNotificationUpdate(null)
  }
}
