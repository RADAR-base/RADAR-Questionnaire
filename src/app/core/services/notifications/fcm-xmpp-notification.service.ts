import { Injectable } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Platform } from 'ionic-angular'
import * as uuid from 'uuid/v4'

import { DefaultMaxUpstreamResends } from '../../../../assets/data/defaultConfig'
import { SingleNotification } from '../../../shared/models/notification-handler'
import { TaskType } from '../../../shared/utilities/task-type'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { FcmNotificationService } from './fcm-notification.service'
import { NotificationGeneratorService } from './notification-generator.service'

declare var FirebasePlugin

@Injectable()
export class FcmXmppNotificationService extends FcmNotificationService {
  constructor(
    public notifications: NotificationGeneratorService,
    public storage: StorageService,
    public schedule: ScheduleService,
    public config: SubjectConfigService,
    public firebase: Firebase,
    public platform: Platform,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService
  ) {
    super(storage, config, firebase, platform, logger, remoteConfig)
  }

  getSubjectDetails() {
    return Promise.all([
      this.config.getParticipantLogin(),
      this.config.getProjectName()
    ]).then(([subjectId, projectId]) => ({
      subjectId,
      projectId
    }))
  }

  publishAllNotifications(user, limit): Promise<any> {
    return this.schedule.getTasks(TaskType.ALL).then(tasks => {
      const fcmNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t, user))
      this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
      this.logger.log(fcmNotifications)
      return Promise.all(
        fcmNotifications
          .map(n => this.sendUpstreamMessage(n))
          .concat([this.setLastNotificationUpdate()])
      )
    })
  }

  publishTestNotification(user): Promise<void> {
    return this.sendUpstreamMessage(
      this.format(this.notifications.createTestNotification(), user)
    )
  }

  cancelAllNotifications(user): Promise<any> {
    return this.sendUpstreamMessage({
      eventId: uuid(),
      action: 'CANCEL',
      cancelType: 'all',
      subjectId: user.subjectId
    })
  }

  cancelSingleNotification(user, notificationId) {
    return
  }

  private sendUpstreamMessage(notification): Promise<any> {
    if (!this.platform.is('cordova')) return Promise.resolve()
    FirebasePlugin.upstream(
      notification,
      succ => this.logger.log('Success sending message upstream', succ),
      err => {
        this.logger.error('Failed to send notification', err)
        if (this.upstreamResends++ < DefaultMaxUpstreamResends)
          this.sendUpstreamMessage(notification)
      }
    )
    return Promise.resolve()
  }

  private format(notification: SingleNotification, user) {
    return {
      eventId: uuid(),
      action: 'SCHEDULE',
      notificationTitle: notification.title,
      notificationMessage: notification.text,
      time: notification.timestamp,
      subjectId: user.subjectId,
      projectId: user.projectId,
      ttlSeconds: this.calculateTtlSeconds(
        notification.task.timestamp,
        notification.timestamp,
        notification.task.completionWindow
      )
    }
  }
}
