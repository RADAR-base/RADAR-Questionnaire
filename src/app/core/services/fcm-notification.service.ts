import uuid = require('uuid/v4')

import { Injectable } from '@angular/core'

import {
  DefaultNumberOfNotificationsToSchedule,
  FCMPluginProjectSenderId
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { SingleNotification } from '../../shared/models/notification-handler'
import { getSeconds } from '../../shared/utilities/time'
import { NotificationGeneratorService } from './notification-generator.service'
import { NotificationService } from './notification.service'
import { SchedulingService } from './scheduling.service'
import { StorageService } from './storage.service'

declare var FCMPlugin

@Injectable()
export class FcmNotificationService extends NotificationService {
  constructor(
    private notifications: NotificationGeneratorService,
    private storage: StorageService,
    private schedule: SchedulingService
  ) {
    super()
  }

  init() {
    FCMPlugin.setSenderId(
      FCMPluginProjectSenderId,
      () => console.log('[NOTIFICATION SERVICE] Set sender id success'),
      error => {
        console.log(error)
        alert(error)
      }
    )
    FCMPlugin.getToken(() =>
      console.log('[NOTIFICATION SERVICE] Refresh token success')
    )
  }

  publish(
    limit: number = DefaultNumberOfNotificationsToSchedule
  ): Promise<void[]> {
    return this.storage.get(StorageKeys.PARTICIPANTLOGIN).then(username => {
      if (!username) {
        return Promise.resolve([])
      }
      return this.schedule.getTasks().then(tasks => {
        const notifications = this.notifications.futureNotifications(
          tasks,
          limit
        )
        const fcmNotifications = notifications.map(t =>
          this.format(t, username)
        )
        console.log('NOTIFICATIONS Scheduling FCM notifications')
        console.log(fcmNotifications)
        return Promise.all(
          fcmNotifications
            .map(this.sendNotification)
            .concat([this.setLastNotificationUpdate()])
        )
      })
    })
  }

  private sendNotification(notification): Promise<void> {
    return FCMPlugin.upstream(
      notification,
      succ => console.log(succ),
      err => console.log(err)
    )
  }

  private format(notification: SingleNotification, participantLogin: string) {
    const endTime =
      notification.task.timestamp + notification.task.completionWindow
    const diffTime = endTime - notification.timestamp

    const ttl =
      diffTime > 0
        ? getSeconds({ milliseconds: diffTime })
        : getSeconds({ minutes: 10 })

    return {
      eventId: uuid(),
      action: 'SCHEDULE',
      notificationTitle: notification.title,
      notificationMessage: notification.text,
      time: notification.timestamp,
      subjectId: participantLogin,
      ttlSeconds: ttl
    }
  }

  cancel(): Promise<void> {
    return this.storage.get(StorageKeys.PARTICIPANTLOGIN).then(username => {
      if (!username) {
        return Promise.resolve()
      }
      return new Promise<void>(function(resolve, reject) {
        FCMPlugin.upstream(
          {
            eventId: uuid(),
            action: 'CANCEL',
            cancelType: 'all',
            subjectId: username
          },
          resolve,
          reject
        )
      })
    })
  }

  permissionCheck(): Promise<void> {
    return Promise.resolve()
  }

  sendTestNotification(): Promise<void> {
    return this.sendNotification(this.notifications.createTestNotification())
  }

  setLastNotificationUpdate(): Promise<void> {
    return this.storage.set(StorageKeys.LAST_NOTIFICATION_UPDATE, Date.now())
  }
}
