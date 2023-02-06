import { Injectable } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Platform } from 'ionic-angular'
import * as moment from 'moment-timezone'
import * as uuid from 'uuid/v4'

import {
  DefaultMaxUpstreamResends,
  DefaultPackageName,
  DefaultSourcePrefix
} from '../../../../assets/data/defaultConfig'
import { AssessmentType } from '../../../shared/models/assessment'
import { SingleNotification } from '../../../shared/models/notification-handler'
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
    public firebase: FirebaseX,
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
      this.config.getProjectName(),
      this.config.getSourceID(),
      this.config.getEnrolmentDate()
    ]).then(([subjectId, projectId, sourceId, enrolmentDate]) => ({
      subjectId,
      projectId,
      sourceId,
      enrolmentDate
    }))
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
          .map(n => this.sendUpstreamMessage(n))
          .concat([this.setLastNotificationUpdate(Date.now())])
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

  cancelSingleNotification(user, notification: SingleNotification) {
    throw new Error('FCM-XMPP Notification Service method not implemented')
  }

  private sendUpstreamMessage(notification): Promise<any> {
    if (!this.platform.is('cordova')) return Promise.resolve()
    FirebasePlugin.upstream(
      notification,
      succ => this.logger.log('Success sending message upstream', succ),
      err => {
        this.logger.error('Failed to send notification', err)
        if (this.upstreamResends++ < DefaultMaxUpstreamResends) {
          this.sendUpstreamMessage(notification)
          setTimeout(() => this.logger.log('Resending message..'), 200)
        }
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
      ),
      type: notification.task.name,
      sourceType: DefaultSourcePrefix,
      appPackage: DefaultPackageName,
      sourceId: user.sourceId,
      enrolmentDate: user.enrolmentDate,
      timezone: moment.tz.guess(),
      language: this.localization.getLanguage().value
    }
  }
}
