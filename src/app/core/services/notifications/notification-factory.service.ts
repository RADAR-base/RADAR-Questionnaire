import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'

import { DefaultNotificationType } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { NotificationMessagingType } from '../../../shared/models/notification-handler'
import { withTimeoutAndDefault } from '../../../shared/utilities/timeout-promise'
import { RemoteConfigService } from '../config/remote-config.service'
import { StorageService } from '../storage/storage.service'
import { FcmRestNotificationService } from './fcm-rest-notification.service'
import { LocalNotificationService } from './local-notification.service'
import { NotificationService } from './notification.service'

const NOTIFICATION_INIT_TIMEOUT_MS = 15_000
const PERMISSION_CHECK_TIMEOUT_MS = 10_000

@Injectable()
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
    return withTimeoutAndDefault(
      this.remoteConfig
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
        ),
      NOTIFICATION_INIT_TIMEOUT_MS,
      undefined,
      'NotificationFactory.init'
    )
  }

  permissionCheck(): Promise<any> {
    if (!this.isPlatformCordova()) return Promise.resolve(true)
    if (!this.notificationService) return Promise.resolve(true)
    return withTimeoutAndDefault(
      this.notificationService.permissionCheck(),
      PERMISSION_CHECK_TIMEOUT_MS,
      undefined,
      'NotificationFactory.permissionCheck'
    )
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
