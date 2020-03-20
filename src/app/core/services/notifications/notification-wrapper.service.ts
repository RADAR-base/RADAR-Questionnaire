import { Injectable } from '@angular/core'

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
    private remoteConfig: RemoteConfigService
  ) {
    super()
    this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.NOTIFICATION_MESSAGING_TYPE,
          DefaultNotificationType
        )
      )
      .then(type => {
        this.notificationService = fcmXmppNotificationService
        if (type == NotificationMessagingType.LOCAL)
          this.notificationService = localNotificationService
        if (type == NotificationMessagingType.FCM_REST)
          this.notificationService = appServerRestNotificationService
      })
  }

  init() {
    return this.notificationService.init()
  }

  permissionCheck(): Promise<any> {
    return this.notificationService.permissionCheck()
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
}
