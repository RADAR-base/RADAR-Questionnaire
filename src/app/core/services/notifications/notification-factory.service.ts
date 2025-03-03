import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'

import { DefaultNotificationType } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { NotificationMessagingType } from '../../../shared/models/notification-handler'
import { RemoteConfigService } from '../config/remote-config.service'
import { StorageService } from '../storage/storage.service'
import { FcmRestNotificationService } from './fcm-rest-notification.service'
import { LocalNotificationService } from './local-notification.service'
import { NotificationService } from './notification.service'

@Injectable({
  providedIn: 'root'
})
export class NotificationFactoryService extends NotificationService {
  notificationService: NotificationService

  constructor(
    public fcmRestNotificationService: FcmRestNotificationService,
    public localNotificationService: LocalNotificationService,
    private remoteConfig: RemoteConfigService,
    private platform: Platform,
    private store: StorageService
  ) {
    super(store)
  }

  init() {
    return this.remoteConfig
      .forceFetch()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.NOTIFICATION_MESSAGING_TYPE,
          DefaultNotificationType
        )
      )
      .then(type => {
        switch (type) {
          case NotificationMessagingType.LOCAL:
            return (this.notificationService = this.localNotificationService)
          case NotificationMessagingType.FCM_REST:
            return (this.notificationService = this.fcmRestNotificationService)
          default:
            throw new Error('No such notification service available')
        }
      })
      .then(() =>
        this.isPlatformCordova()
          ? this.notificationService.init()
          : (this.notificationService = this.fcmRestNotificationService)
      )
  }

  permissionCheck(): Promise<any> {
    return this.isPlatformCordova()
      ? this.notificationService.permissionCheck()
      : true
  }

  publish(type, limit?, notificationId?): Promise<any> {
    return this.notificationService.publish(type, limit, notificationId)
  }

  unregisterFromNotifications(): Promise<any> {
    return this.notificationService.unregisterFromNotifications()
  }

  isPlatformCordova() {
    return this.platform.is('cordova')
  }
}
