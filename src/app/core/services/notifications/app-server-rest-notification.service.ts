import { Injectable } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Platform } from 'ionic-angular'

import {
  DefaultMaxUpstreamResends,
  DefaultPackageName,
  DefaultSourcePrefix
} from '../../../../assets/data/defaultConfig'
import { AssessmentType } from '../../../shared/models/assessment'
import { SingleNotification } from '../../../shared/models/notification-handler'
import { AppServerService } from '../app-server/app-server.service'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { FcmNotificationService } from './fcm-notification.service'
import { NotificationGeneratorService } from './notification-generator.service'

@Injectable()
export class AppServerRestNotificationService extends FcmNotificationService {
  FCM_NOTIFICATION_CONTROLLER = 'fcm-notification-controller'

  constructor(
    public notifications: NotificationGeneratorService,
    public storage: StorageService,
    public schedule: ScheduleService,
    public config: SubjectConfigService,
    public firebase: Firebase,
    public platform: Platform,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService,
    private appServerService: AppServerService
  ) {
    super(storage, config, firebase, platform, logger, remoteConfig)
  }

  getSubjectDetails() {
    return Promise.all([
      this.appServerService.checkProjectAndSubjectExistElseCreate(),
      this.config.getSourceID()
    ]).then(([user, sourceId]) => Object.assign({}, user, { sourceId }))
  }

  publishAllNotifications(user, limit): Promise<any> {
    return this.schedule.getTasks(AssessmentType.ALL).then(tasks => {
      const fcmNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t, user))
      this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
      this.logger.log(fcmNotifications)
      return Promise.all(
        fcmNotifications
          .map(n => this.sendNotification(n, user.subjectId, user.projectId))
          .concat([this.setLastNotificationUpdate(Date.now())])
      )
    })
  }

  publishTestNotification(user): Promise<void> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification(), user),
      user.subjectId,
      user.projectId
    )
  }

  cancelAllNotifications(user): Promise<any> {
    return this.appServerService.getApiClient().then(apiClient =>
      apiClient.apis[
        this.FCM_NOTIFICATION_CONTROLLER
      ].deleteNotificationsForUser({
        subjectId: user.subjectId,
        projectId: user.projectId
      })
    )
  }

  cancelSingleNotification(user, notificationId) {
    return this.appServerService.getApiClient().then(apiClient =>
      apiClient.apis[this.FCM_NOTIFICATION_CONTROLLER]
        .deleteNotificationUsingProjectIdAndSubjectIdAndNotificationId({
          subjectId: user.subjectId,
          projectId: user.projectId,
          id: notificationId
        })
        .then(() =>
          console.log('Success cancelling notification ' + notificationId)
        )
    )
  }

  private sendNotification(notification, subjectId, projectId): Promise<any> {
    return this.appServerService.getApiClient().then(apiClient =>
      apiClient.apis[this.FCM_NOTIFICATION_CONTROLLER]
        .addSingleNotification(
          { projectId: projectId, subjectId: subjectId },
          { requestBody: notification.notificationDto }
        )
        .then(res => {
          notification.notification.id = res.body.id
          return this.logger.log('Successfully sent! Updating notification Id')
        })
        .catch(err => {
          this.logger.error('Failed to send notification', err)
          if (this.upstreamResends++ < DefaultMaxUpstreamResends)
            this.sendNotification(notification, subjectId, projectId)
        })
    )
  }

  private format(notification: SingleNotification, user) {
    const taskInfo = notification.task
    return {
      notification,
      notificationDto: {
        title: notification.title,
        body: notification.text,
        ttlSeconds: this.calculateTtlSeconds(
          taskInfo.timestamp,
          notification.timestamp,
          taskInfo.completionWindow
        ),
        sourceId: user.sourceId,
        type: taskInfo.name,
        sourceType: DefaultSourcePrefix,
        appPackage: DefaultPackageName,
        scheduledTime: new Date(notification.timestamp)
      }
    }
  }
}
