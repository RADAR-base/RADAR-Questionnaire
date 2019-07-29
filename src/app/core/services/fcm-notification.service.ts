import uuid = require('uuid/v4')

import {
  DefaultMaxUpstreamResends,
  DefaultNumberOfNotificationsToSchedule,
  FCMPluginProjectSenderId
} from '../../../assets/data/defaultConfig'

import { Firebase } from '@ionic-native/firebase/ngx'
import { Injectable } from '@angular/core'
import { NotificationGeneratorService } from './notification-generator.service'
import { NotificationService } from './notification.service'
import { Platform } from 'ionic-angular'
import { SchedulingService } from './scheduling.service'
import { SingleNotification } from '../../shared/models/notification-handler'
import { StorageKeys } from '../../shared/enums/storage'
import { StorageService } from './storage.service'
import { getSeconds } from '../../shared/utilities/time'
import { LogService } from './log.service'

declare var FirebasePlugin

@Injectable()
export class FcmNotificationService extends NotificationService {
  upstreamResends: number

  constructor(
    private notifications: NotificationGeneratorService,
    private storage: StorageService,
    private schedule: SchedulingService,
    private platform: Platform,
    private firebase: Firebase,
    private logger: LogService,
  ) {
    super()
  }

  init() {
    FirebasePlugin.setSenderId(
      FCMPluginProjectSenderId,
      () => console.log('[NOTIFICATION SERVICE] Set sender id success'),
      error => {
        this.logger.error("Failed to set sender ID", error)
        alert(error)
      }
    )
    FirebasePlugin.getToken(() =>
      console.log('[NOTIFICATION SERVICE] Refresh token success')
    )
  }

  publish(
    limit: number = DefaultNumberOfNotificationsToSchedule
  ): Promise<void[]> {
    this.resetResends()
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
        this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
        this.logger.log(fcmNotifications)
        return Promise.all(
          fcmNotifications
            .map(n => {
              return this.sendNotification(n)
            })
            .concat([this.setLastNotificationUpdate()])
        )
      })
    })
  }

  private sendNotification(notification): Promise<void> {
    FirebasePlugin.upstream(
      notification,
      succ => console.log(succ),
      err => {
        this.logger.error('Failed to send notification', err)
        if (this.upstreamResends++ < DefaultMaxUpstreamResends)
          this.sendNotification(notification)
      }
    )
    return Promise.resolve()
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
      return this.sendNotification({
        eventId: uuid(),
        action: 'CANCEL',
        cancelType: 'all',
        subjectId: username
      })
    })
  }

  permissionCheck(): Promise<void> {
    if (!this.platform.is('ios')) return Promise.resolve()
    return this.firebase
      .hasPermission()
      .then(res => (res.isEnabled ? true : this.firebase.grantPermission()))
  }

  sendTestNotification(): Promise<void> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification(), '')
    )
  }

  setLastNotificationUpdate(): Promise<void> {
    return this.storage.set(StorageKeys.LAST_NOTIFICATION_UPDATE, Date.now())
  }

  resetResends() {
    this.upstreamResends = 0
  }
}
