import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { WebIntent } from '@ionic-native/web-intent/ngx'
import { Platform } from 'ionic-angular'
import { Subscription } from 'rxjs'
import * as urljoin from 'url-join'

import {
  DefaultPackageName,
  DefaultSourcePrefix
} from '../../../../assets/data/defaultConfig'
import {
  FcmNotificationDto,
  FcmNotificationError,
  FcmNotifications
} from '../../../shared/models/app-server'
import { AssessmentType } from '../../../shared/models/assessment'
import {
  NotificationMessagingState,
  SingleNotification
} from '../../../shared/models/notification-handler'
import { getMilliseconds } from '../../../shared/utilities/time'
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
export class FcmRestNotificationService extends FcmNotificationService {
  NOTIFICATIONS_PATH = 'messaging/notifications'
  SUBJECT_PATH = 'users'
  PROJECT_PATH = 'projects'

  resumeListener: Subscription = new Subscription()

  constructor(
    public notifications: NotificationGeneratorService,
    public storage: StorageService,
    public schedule: ScheduleService,
    public config: SubjectConfigService,
    public firebase: FirebaseX,
    public platform: Platform,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService,
    private appServerService: AppServerService,
    private webIntent: WebIntent
  ) {
    super(storage, config, firebase, platform, logger, remoteConfig)
    this.platform.ready().then(() => {
      this.onAppOpen()
      this.resumeListener = this.platform.resume.subscribe(() =>
        this.onAppOpen()
      )
    })
  }

  init() {
    super.init()
    return this.appServerService.init()
  }

  onAppOpen() {
    return this.webIntent.getIntent().then(intent => {
      if (!intent.extras) return
      const extras = intent.extras['google.message_id'].split(':')
      const messageId = extras[extras.length - 1]
      return Promise.all([
        this.getSubjectDetails(),
        this.schedule.getTasks(AssessmentType.ALL)
      ]).then(([subject, tasks]) => {
        const notification = this.notifications.findNotificationByMessageId(
          tasks,
          messageId
        )
        return this.appServerService
          .updateNotificationState(
            subject,
            notification.id,
            NotificationMessagingState.DELIVERED
          )
          .then(() =>
            this.appServerService.updateNotificationState(
              subject,
              notification.id,
              NotificationMessagingState.OPENED
            )
          )
      })
    })
  }

  getSubjectDetails() {
    return Promise.all([
      this.appServerService.init(),
      this.config.getProjectName(),
      this.config.getParticipantLogin()
    ])
      .then(([, projectId, subjectId]) =>
        Promise.all([
          this.appServerService.getSubject(projectId, subjectId),
          this.config.getSourceID()
        ])
      )
      .then(([subject, sourceId]) => Object.assign({}, subject, { sourceId }))
  }

  publishAllNotifications(subject, limit): Promise<any> {
    return this.schedule.getTasks(AssessmentType.ALL).then(tasks => {
      const fcmNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t, subject))
      this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
      this.logger.log(fcmNotifications)
      return Promise.all(
        fcmNotifications.map(n =>
          this.sendNotification(n, subject.subjectId, subject.projectId)
        )
      )
    })
  }

  publishTestNotification(subject): Promise<any> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification(), subject),
      subject.subjectId,
      subject.projectId
    )
  }

  sendNotification(notification, subjectId, projectId) {
    return this.appServerService
      .addNotification(notification, subjectId, projectId)
      .then((resultNotification: FcmNotificationDto) => {
        this.setLastNotificationUpdate(Date.now())
        notification.notification.id = resultNotification.id
        return (notification.notification.messageId =
          resultNotification.fcmMessageId)
      })
  }

  cancelAllNotifications(subject): Promise<any> {
    return this.appServerService
      .pullAllPublishedNotifications(subject)
      .then((res: FcmNotifications) => {
        const now = Date.now()
        const notifications = res.notifications
          .map(n => ({
            id: n.id,
            timestamp: getMilliseconds({ seconds: n.scheduledTime })
          }))
          .filter(n => n.timestamp > now)
        notifications.map(o => this.cancelSingleNotification(subject, o))
      })
  }

  cancelSingleNotification(subject, notification: SingleNotification) {
    if (notification.id) {
      return this.appServerService
        .deleteNotification(subject, notification)
        .then(() => {
          this.logger.log('Success cancelling notification ' + notification.id)
          return (notification.id = undefined)
        })
    } else {
      this.logger.log('Cannot cancel undefined notification id.')
      return Promise.resolve()
    }
  }

  private format(notification: SingleNotification, subject) {
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
        sourceId: subject.sourceId,
        type: taskInfo.name,
        sourceType: DefaultSourcePrefix,
        appPackage: DefaultPackageName,
        scheduledTime: new Date(notification.timestamp)
      }
    }
  }
}
