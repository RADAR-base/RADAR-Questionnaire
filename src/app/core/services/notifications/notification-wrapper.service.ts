import { Injectable } from '@angular/core'
import { Platform } from 'ionic-angular'

import { DefaultNotificationType } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { NotificationMessagingType } from '../../../shared/models/notification-handler'
import { RemoteConfigService } from '../config/remote-config.service'
import { AppServerRestNotificationService } from './app-server-rest-notification.service'
import { FcmXmppNotificationService } from './fcm-xmpp-notification.service'
import { LocalNotificationService } from './local-notification.service'
import { NotificationService } from './notification.service'

@Injectable()
export class NotificationWrapperService extends NotificationService {
  notificationService: NotificationService

  constructor(
    public appServerRestNotificationService: AppServerRestNotificationService,
    public fcmXmppNotificationService: FcmXmppNotificationService,
    public localNotificationService: LocalNotificationService,
    private remoteConfig: RemoteConfigService,
    private platform: Platform
  ) {
    super()
  }

  init() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.NOTIFICATION_MESSAGING_TYPE,
          DefaultNotificationType
        )
      )
      .then(type => {
        if (type == NotificationMessagingType.LOCAL)
          return (this.notificationService = this.localNotificationService)
        if (type == NotificationMessagingType.FCM_REST)
          return (this.notificationService = this.appServerRestNotificationService)
        return (this.notificationService = this.fcmXmppNotificationService)
      })
      .then(() =>
        this.isPlatformCordova() ? this.notificationService.init() : true
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

  setLastNotificationUpdate(): Promise<any> {
    return this.notificationService.setLastNotificationUpdate()
  }

  getLastNotificationUpdate(): Promise<any> {
    return this.notificationService.getLastNotificationUpdate()
  }

  isPlatformCordova() {
    return this.platform.is('cordova')
  }
}
