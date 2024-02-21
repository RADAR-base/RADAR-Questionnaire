import { Injectable } from '@angular/core'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { Platform } from '@ionic/angular'

import {
  DefaultNotificationTtlMinutes,
  DefaultNumberOfNotificationsToSchedule
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { NotificationActionType } from '../../../shared/models/notification-handler'
import { getSeconds } from '../../../shared/utilities/time'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LogService } from '../misc/log.service'
import { GlobalStorageService } from '../storage/global-storage.service'
import { StorageService } from '../storage/storage.service'
import { NotificationService } from './notification.service'

@Injectable()
export abstract class FcmNotificationService extends NotificationService {
  FCM_TOKEN: string
  upstreamResends: number
  ttlMinutes = 10

  constructor(
    public store: GlobalStorageService,
    public config: SubjectConfigService,
    public platform: Platform,
    public logger: LogService,
    public remoteConfig: RemoteConfigService
  ) {
    super(store)
    this.platform.ready().then(() => {
      this.remoteConfig.subject().subscribe(cfg => {
        cfg
          .getOrDefault(
            ConfigKeys.NOTIFICATION_TTL_MINUTES,
            String(this.ttlMinutes)
          )
          .then(
            ttl =>
              (this.ttlMinutes = Number(ttl) || DefaultNotificationTtlMinutes)
          )
      })
    })
  }

  async init() {
    await FirebaseMessaging.addListener('tokenReceived', event =>
      this.onTokenRefresh(event.token)
    )
    return this.getFcmToken().then(token => {
      this.onTokenRefresh(token)
    })
  }

  getFcmToken() {
    return FirebaseMessaging.getToken().then(async res => {
      return res ? res.token : null
    })
  }

  publish(
    type,
    limit: number = DefaultNumberOfNotificationsToSchedule,
    notificationId?: string
  ): Promise<any> {
    this.resetResends()
    return this.getSubjectDetails().then(user => {
      if (!user) return Promise.reject('Unable to pull subject details')
      switch (type) {
        case NotificationActionType.TEST:
          return this.publishTestNotification(user)
        case NotificationActionType.CANCEL_ALL:
          return this.cancelAllNotifications(user)
        case NotificationActionType.CANCEL_SINGLE:
          return this.cancelSingleNotification(user, notificationId)
        case NotificationActionType.SCHEDULE_ALL:
        default:
          return this.publishAllNotifications(user, limit)
      }
    })
  }

  async permissionCheck(): Promise<void> {
    if (!this.platform.is('ios')) return Promise.resolve()
    const result = await FirebaseMessaging.requestPermissions()
    return
  }

  setFCMToken(token) {
    return this.store.set(StorageKeys.FCM_TOKEN, token)
  }

  resetResends() {
    this.upstreamResends = 0
  }

  calculateTtlSeconds(taskTimestamp, notificationTimestamp, completionWindow) {
    const endTime = taskTimestamp + completionWindow
    const timeUntilEnd = endTime - notificationTimestamp
    return timeUntilEnd > 0
      ? getSeconds({ milliseconds: timeUntilEnd })
      : getSeconds({ minutes: this.ttlMinutes })
  }

  async unregisterFromNotifications(): Promise<any> {
    await FirebaseMessaging.removeAllListeners()
    // NOTE: This will delete the current device token and stop receiving notifications
    return FirebaseMessaging.deleteToken()
  }

  onTokenRefresh(token) {
    if (token) {
      this.FCM_TOKEN = token
      return this.setFCMToken(token).then(() =>
        this.logger.log('[NOTIFICATION SERVICE] Refresh token success')
      )
    } else {
      return Promise.resolve()
    }
  }

  abstract getSubjectDetails()

  abstract publishAllNotifications(user, limit)

  abstract publishTestNotification(user)

  abstract cancelAllNotifications(user)

  abstract cancelSingleNotification(user, notificationId)
}
