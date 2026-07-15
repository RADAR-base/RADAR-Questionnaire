import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'

import {
  DefaultNotificationDeduplicationEnabled,
  DefaultPackageName,
  DefaultSourcePrefix,
  DefaultTask
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import {
  FcmNotificationDto,
  FcmNotificationError,
  FcmNotifications
} from '../../../shared/models/app-server'
import { AssessmentType } from '../../../shared/models/assessment'
import {
  NotificationMessagingState,
  NotificationType,
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
import { GrabIntentExtras } from 'capacitor-grab-intent-extras'

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
    public platform: Platform,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService,
    private appServerService: AppServerService,
  ) {
    super(storage, config, platform, logger, remoteConfig)
    this.platform.ready().then(() => {
      this.onAppOpen()
      this.resumeListener = this.platform.resume.subscribe(() =>
        this.onAppOpen()
      )
    })
  }

  init() {
    return super.init().then(() => this.appServerService.init())
  }

  onAppOpen() {
    return GrabIntentExtras.getIntentExtras().then(extras => {
      if (!extras) return
      const messageId = extras['google.message_id'] ?
        extras['google.message_id'].split(':').slice(-1) : extras['gcm.message_id'] ?
          extras['gcm.message_id'].split(':').slice(-1) : null
      return Promise.all([
        this.getSubjectDetails(),
        this.schedule.getTasks(AssessmentType.ALL)
      ]).then(([subject, tasks]) => {
        if (!messageId) return
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
    return Promise.all([
      this.schedule.getTasks(AssessmentType.ALL),
      this.remoteConfig
        .forceFetch()
        .then(config =>
          config.getOrDefault(
            ConfigKeys.NOTIFICATION_DEDUPLICATION,
            DefaultNotificationDeduplicationEnabled.toString()
          )
        )
        .then(val => val === 'true')
        .catch(() => false)
    ]).then(([tasks, deduplicationEnabled]) => {
      let fcmNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t, subject))
      if (deduplicationEnabled) {
        fcmNotifications = this.deduplicateNotifications(fcmNotifications)
      }
      this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
      this.logger.log(fcmNotifications)
      return Promise.all(
        fcmNotifications.map(n =>
          this.sendNotification(n, subject.subjectId, subject.projectId)
        )
      )
    })
  }

  private deduplicateNotifications(notifications: any[]): any[] {
    const seen = new Set<string>()
    return notifications.filter(n => {
      const dto = n.notificationDto
      const key = `${dto.title}|${dto.body}|${new Date(dto.scheduledTime).getTime()}`
      if (seen.has(key)) {
        this.logger.log(
          `NOTIFICATIONS Dedup: skipping duplicate notification "${dto.title}" at ${dto.scheduledTime}`
        )
        return false
      }
      seen.add(key)
      return true
    })
  }

  publishTestNotification(subject): Promise<any> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification(), subject),
      subject.subjectId,
      subject.projectId
    )
  }

  publishCustomNotification(subject, timestamp, title, text): Promise<any> {
    return this.sendNotification(
      this.format(this.notifications.createNotification(
        DefaultTask,
        timestamp,
        NotificationType.NOW,
        { title: { en: title, }, text: { en: text, } }
      ), subject),
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
        notifications.map(o => this.cancelSingleNotification(subject, o.id).then(() => o.id = undefined))
      })
  }

  cancelSingleNotification(subject, notificationId) {
    if (notificationId) {
      return this.appServerService
        .deleteNotification(subject, notificationId)
        .then(() => {
          return this.logger.log('Success cancelling notification ' + notificationId)
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
