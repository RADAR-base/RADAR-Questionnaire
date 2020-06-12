import { Injectable } from '@angular/core'

import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'

@Injectable()
export abstract class NotificationService {
  private readonly NOTIFICATION_STORAGE = {
    LAST_NOTIFICATION_UPDATE: StorageKeys.LAST_NOTIFICATION_UPDATE
  }
  constructor(public storage: StorageService) {}

  abstract init()

  abstract permissionCheck()

  abstract publish(type, limit?, notificationId?)

  setLastNotificationUpdate(timestamp): Promise<void> {
    return this.storage.set(
      this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE,
      timestamp
    )
  }
  getLastNotificationUpdate() {
    return this.storage.get(this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE)
  }

  reset() {
    return this.setLastNotificationUpdate(null)
  }
}
