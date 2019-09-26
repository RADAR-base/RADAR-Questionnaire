import { Injectable } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Platform } from 'ionic-angular'
import * as uuid from 'uuid/v4'

import {
  DefaultMaxUpstreamResends, DefaultNotificationTtlMinutes,
  DefaultNumberOfNotificationsToSchedule,
  FCMPluginProjectSenderId,
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { SingleNotification } from '../../../shared/models/notification-handler'
import { TaskType } from '../../../shared/utilities/task-type'
import { getSeconds } from '../../../shared/utilities/time'
import { SubjectConfigService } from '../config/subject-config.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { NotificationGeneratorService } from './notification-generator.service'
import { NotificationService } from './notification.service'
import { RemoteConfigService } from '../config/remote-config.service'
import { ConfigKeys } from '../../../shared/enums/config'

declare var FirebasePlugin

@Injectable()
export class FcmNotificationService extends NotificationService {
  private readonly NOTIFICATION_STORAGE = {
    LAST_NOTIFICATION_UPDATE: StorageKeys.LAST_NOTIFICATION_UPDATE
  }
  upstreamResends: number
  ttlMinutes: number

  constructor(
    private notifications: NotificationGeneratorService,
    private storage: StorageService,
    private schedule: ScheduleService,
    private config: SubjectConfigService,
    private firebase: Firebase,
    private platform: Platform,
    private logger: LogService,
    private remoteConfig: RemoteConfigService
  ) {
    super()
    this.ttlMinutes = 10

    this.remoteConfig.subject()
      .subscribe(cfg => {
        cfg.getOrDefault(ConfigKeys.NOTIFICATION_TTL_MINUTES, String(this.ttlMinutes))
          .then(ttl => this.ttlMinutes = Number(ttl) || DefaultNotificationTtlMinutes)
      })
  }

  init() {
    FirebasePlugin.setSenderId(
      FCMPluginProjectSenderId,
      () => console.log('[NOTIFICATION SERVICE] Set sender id success'),
      error => {
        this.logger.error('Failed to set sender ID', error)
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
    return this.config.getParticipantLogin().then(username => {
      if (!username) return Promise.resolve([])
      return this.schedule.getTasks(TaskType.ALL).then(tasks => {
        const fcmNotifications = this.notifications
          .futureNotifications(tasks, limit)
          .map(t => this.format(t, username))
        this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
        this.logger.log(fcmNotifications)
        return Promise.all(
          fcmNotifications
            .map(n => this.sendNotification(n))
            .concat([this.setLastNotificationUpdate()])
        )
      })
    })
  }

  private sendNotification(notification): Promise<void> {
    if (!this.platform.is('cordova')) return Promise.resolve()
    FirebasePlugin.upstream(
      notification,
      succ => this.logger.log('Success sending message upstream', succ),
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
    const timeUntilEnd = endTime - notification.timestamp

    const ttl =
      timeUntilEnd > 0
        ? getSeconds({ milliseconds: timeUntilEnd })
        : getSeconds({ minutes: this.ttlMinutes })

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
    return this.config.getParticipantLogin().then(username => {
      if (!username) {
        return
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
    return this.storage.set(
      this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE,
      Date.now()
    )
  }

  getLastNotificationUpdate() {
    return this.storage.get(this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE)
  }

  resetResends() {
    this.upstreamResends = 0
  }
}
