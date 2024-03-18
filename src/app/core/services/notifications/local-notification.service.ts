import { Injectable } from '@angular/core'
import {
  LocalNotifications,
  ScheduleResult
} from '@capacitor/local-notifications'

import { DefaultNumberOfNotificationsToSchedule } from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { AssessmentType } from '../../../shared/models/assessment'
import {
  NotificationActionType,
  SingleNotification
} from '../../../shared/models/notification-handler'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { GlobalStorageService } from '../storage/global-storage.service'
import { NotificationGeneratorService } from './notification-generator.service'
import { NotificationService } from './notification.service'

@Injectable()
export class LocalNotificationService extends NotificationService {
  constructor(
    private notifications: NotificationGeneratorService,
    private schedule: ScheduleService,
    private store: GlobalStorageService,
    private logger: LogService
  ) {
    super(store)
  }

  init() {
    this.permissionCheck()
  }

  publish(
    type,
    limit: number = DefaultNumberOfNotificationsToSchedule,
    notificationId?: string
  ): Promise<any> {
    switch (type) {
      case NotificationActionType.TEST:
        return this.publishTestNotification()
      case NotificationActionType.CANCEL_ALL:
        return this.cancelAllNotifications()
      case NotificationActionType.SCHEDULE_ALL:
      default:
        return this.publishAllNotifications(limit)
    }
  }

  publishAllNotifications(
    limit: number = DefaultNumberOfNotificationsToSchedule
  ): Promise<void> {
    return this.schedule.getTasks(AssessmentType.ALL).then(tasks => {
      const localNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t))
      this.logger.log(
        'NOTIFICATIONS Scheduling LOCAL notifications',
        localNotifications
      )
      return Promise.all(
        localNotifications.map(n => {
          return this.sendNotification(n)
        })
      ).then(() => this.setLastNotificationUpdate(Date.now()))
    })
  }

  private sendNotification(notification): Promise<ScheduleResult> {
    return LocalNotifications.schedule(notification)
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

  cancelAllNotifications(user?): Promise<any> {
    return Promise.resolve()
  }

  permissionCheck(): Promise<void> {
    return LocalNotifications.checkPermissions().then(p => {
      if (p.display != 'granted') LocalNotifications.requestPermissions()
    })
  }

  publishTestNotification(): Promise<ScheduleResult> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification())
    )
  }

  unregisterFromNotifications(): Promise<any> {
    return Promise.resolve('Method not available for notification type.')
  }
}
