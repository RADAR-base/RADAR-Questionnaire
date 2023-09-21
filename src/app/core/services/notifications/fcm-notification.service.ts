import { Injectable } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import {
  DefaultNotificationTtlMinutes,
  DefaultNumberOfNotificationsToSchedule,
  FCMPluginProjectSenderId
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
  private tokenSubscription: Subscription

  constructor(
    public store: GlobalStorageService,
    public config: SubjectConfigService,
    public firebase: FirebaseX,
    public platform: Platform,
    public logger: LogService,
    public remoteConfig: RemoteConfigService
  ) {
    super(store)
    this.tokenSubscription = null
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

  init() {
    console.log('Class: FcmNotificationService, Function: init, Line 55 ' , );
    return this.firebase
      .setAutoInitEnabled(true)
      .then(() => this.firebase.getToken())
      .then(token => {
        if (this.tokenSubscription === null) {
          this.tokenSubscription = this.firebase
            .onTokenRefresh()
            .subscribe(t => this.onTokenRefresh(t))
        }
        if (token) {
          return this.onTokenRefresh(token)
        }
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

  // publish(
  //   type,
  //   limit: number = DefaultNumberOfNotificationsToSchedule,
  //   notificationId?: string
  // ) {
  //   this.resetResends()
  //   this.getSubjectDetails().then(user => {
  //     if (!user) return Promise.reject('Unable to pull subject details')
  //     switch (type) {
  //       case NotificationActionType.TEST:
  //         return this.publishTestNotification(user)
  //       case NotificationActionType.CANCEL_ALL:
  //         return this.cancelAllNotifications(user)
  //       case NotificationActionType.CANCEL_SINGLE:
  //         return this.cancelSingleNotification(user, notificationId)
  //       case NotificationActionType.SCHEDULE_ALL:
  //       default:
  //         return this.publishAllNotifications(user, limit)
  //     }
  //   })
  // }


  permissionCheck(): Promise<void> {
    if (!this.platform.is('ios')) return Promise.resolve()
    return this.firebase
      .hasPermission()
      .then(res => (res ? true : this.firebase.grantPermission()))
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

  unregisterFromNotifications(): Promise<any> {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe()
      this.tokenSubscription = null
    }
    // NOTE: This will delete the current device token and stop receiving notifications
    return this.firebase
      .setAutoInitEnabled(false)
      .then(() => this.firebase.unregister())
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
