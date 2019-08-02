import uuid = require('uuid/v4')

import { DefaultNumberOfNotificationsToSchedule } from '../../../../assets/data/defaultConfig'
import { Injectable } from '@angular/core'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { NotificationGeneratorService } from './notification-generator.service'
import { NotificationService } from './notification.service'
import { ScheduleService } from '../schedule/schedule.service'
import { SingleNotification } from '../../../shared/models/notification-handler'
import { StorageKeys } from '../../../shared/enums/storage'
import { StorageService } from '../storage/storage.service'
import { TaskType } from '../../../shared/utilities/task-type'

@Injectable()
export class LocalNotificationService extends NotificationService {
  private readonly NOTIFICATION_STORAGE = {
    LAST_NOTIFICATION_UPDATE: StorageKeys.LAST_NOTIFICATION_UPDATE
  }

  constructor(
    private notifications: NotificationGeneratorService,
    private schedule: ScheduleService,
    private localNotifications: LocalNotifications,
    private storage: StorageService
  ) {
    super()
  }

  init() {
    this.permissionCheck()
  }

  publish(
    limit: number = DefaultNumberOfNotificationsToSchedule
  ): Promise<void[]> {
    return this.schedule.getTasks(TaskType.ALL).then(tasks => {
      const localNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t))
      console.log('NOTIFICATIONS Scheduling LOCAL notifications')
      console.log(localNotifications)
      return Promise.all(
        localNotifications
          .map(n => {
            return this.sendNotification(n)
          })
          .concat([this.setLastNotificationUpdate()])
      )
    })
  }

  private sendNotification(notification): Promise<void> {
    return Promise.resolve(this.localNotifications.schedule(notification))
  }

  private format(notification: SingleNotification) {
    return {
      title: notification.title,
      text: notification.text,
      trigger: { at: new Date(notification.timestamp) },
      foreground: true,
      vibrate: true,
      sound: 'file://assets/sounds/serious-strike.mp3',
      smallIcon: 'res://mipmap-ldpi/ic_launcher.png'
    }
  }

  cancel(): Promise<void> {
    this.localNotifications.cancelAll()
    return Promise.resolve()
  }

  permissionCheck(): Promise<void> {
    return Promise.resolve(
      this.localNotifications.hasPermission().then(p => {
        if (!p) {
          this.localNotifications.requestPermission()
        }
      })
    )
  }

  sendTestNotification(): Promise<void> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification())
    )
  }

  setLastNotificationUpdate(): Promise<void> {
    return this.storage.set(
      this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE,
      Date.now()
    )
  }

  getLastNotificationUpdate(): Promise<any> {
    return this.storage.get(this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE)
  }
}