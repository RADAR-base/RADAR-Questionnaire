import { Injectable } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Platform } from 'ionic-angular'
import * as Swagger from 'swagger-client'

import {
  DefaultMaxUpstreamResends,
  DefaultNotificationTtlMinutes,
  DefaultNumberOfNotificationsToSchedule,
  DefaultPackageName,
  DefaultSourcePrefix,
  FCMPluginProjectSenderId
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { FcmNotificationDto } from '../../../shared/models/models'
import {
  NotificationActionType,
  SingleNotification
} from '../../../shared/models/notification-handler'
import { TaskType } from '../../../shared/utilities/task-type'
import { getSeconds } from '../../../shared/utilities/time'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { StorageService } from '../storage/storage.service'
import { NotificationGeneratorService } from './notification-generator.service'
import { NotificationService } from './notification.service'

declare var FirebasePlugin

@Injectable()
export class FcmNotificationService extends NotificationService {
  private APP_SERVER_URL = 'http://localhost:8080'
  private readonly NOTIFICATION_STORAGE = {
    LAST_NOTIFICATION_UPDATE: StorageKeys.LAST_NOTIFICATION_UPDATE
  }
  FCM_TOKEN: string
  upstreamResends: number
  ttlMinutes: number
  apiClient

  constructor(
    private notifications: NotificationGeneratorService,
    private storage: StorageService,
    private schedule: ScheduleService,
    private config: SubjectConfigService,
    private firebase: Firebase,
    private platform: Platform,
    private logger: LogService,
    private remoteConfig: RemoteConfigService,
    private localization: LocalizationService
  ) {
    super()
    this.ttlMinutes = 10
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
    this.initApiClient()
  }

  async initApiClient() {
    await Swagger({ url: `${this.APP_SERVER_URL}/v3/api-docs` }).then(
      client => {
        this.apiClient = client
        console.log(this.apiClient)
      }
    )
  }

  init() {
    FirebasePlugin.setSenderId(
      FCMPluginProjectSenderId,
      () => this.logger.log('[NOTIFICATION SERVICE] Set sender id success'),
      error => {
        this.logger.error('Failed to set sender ID', error)
        alert(error)
      }
    )
    FirebasePlugin.getToken(token => {
      this.FCM_TOKEN = token
      this.logger.log('[NOTIFICATION SERVICE] Refresh token success')
    })
  }

  publish(
    limit: number = DefaultNumberOfNotificationsToSchedule,
    type?
  ): Promise<void[]> {
    this.resetResends()
    return Promise.all([
      this.checkProjectAndSubjectExistElseCreate(),
      this.config.getSourceID()
    ]).then(([user, sourceId]) => {
      switch (type) {
        case NotificationActionType.TEST:
          return this.publishTestNotification(user, sourceId)
        case NotificationActionType.CANCEL:
          return this.cancelAllNotifications(user)
        default:
          return this.publishAllNotifications(user, sourceId, limit)
      }
    })
  }

  publishAllNotifications(user, sourceId, limit): Promise<any> {
    return this.schedule.getTasks(TaskType.ALL).then(tasks => {
      const fcmNotifications = this.notifications
        .futureNotifications(tasks, limit)
        .map(t => this.format(t, sourceId))
      this.logger.log('NOTIFICATIONS Scheduling FCM notifications')
      this.logger.log(fcmNotifications)
      return Promise.all(
        fcmNotifications
          .map(n => this.sendNotification(n, user.subjectId, user.projectId))
          .concat([this.setLastNotificationUpdate()])
      )
    })
  }

  publishTestNotification(user, sourceId): Promise<void> {
    return this.sendNotification(
      this.format(this.notifications.createTestNotification(), sourceId),
      user.subjectId,
      user.projectId
    )
  }

  cancelAllNotifications(user): Promise<any> {
    console.log(user)
    return this.apiClient.apis[
      'fcm-notification-controller'
    ].deleteNotificationsForUser({
      subjectId: user.subjectId,
      projectId: user.projectId
    })
  }

  private checkProjectAndSubjectExistElseCreate(): Promise<any> {
    return this.checkProjectExistsElseCreate().then(() =>
      this.checkSubjectExistsElseCreate()
    )
  }

  private checkProjectExistsElseCreate(): Promise<any> {
    return this.config.getProjectName().then(projectId => {
      return this.apiClient.apis['radar-project-controller']
        .getProjectsUsingProjectId({ projectId })
        .catch(e => {
          if (e.status == 404) {
            return this.apiClient.apis['radar-project-controller'].addProject({
              projectId
            })
          } else return Promise.reject(e)
        })
    })
  }

  private checkSubjectExistsElseCreate(): Promise<any> {
    return Promise.all([
      this.config.getEnrolmentDate(),
      this.config.getProjectName(),
      this.config.getParticipantLogin()
    ]).then(([enrolmentDate, projectId, subjectId]) => {
      if (!subjectId) return Promise.reject('Subject id is null')
      return this.apiClient.apis['radar-user-controller']
        .getRadarUserUsingSubjectId({ subjectId })
        .then(res => res.body)
        .catch(e => {
          if (e.status == 404) {
            const user = {
              enrolmentDate: new Date(enrolmentDate),
              projectId,
              subjectId,
              fcmToken: this.FCM_TOKEN,
              timezone: new Date().getTimezoneOffset(),
              language: this.localization.getLanguage().value
            }
            return this.apiClient.apis['radar-user-controller'].addUser({
              user
            })
          } else return Promise.reject(e)
        })
    })
  }

  private sendNotification(notification, subjectId, projectId): Promise<any> {
    return this.apiClient.apis['fcm-notification-controller']
      .addSingleNotification(
        {
          projectId,
          subjectId
        },
        { requestBody: notification.notificationDto }
      )
      .then(res => {
        notification.notification.id = res.body.id
        return this.logger.log(
          'Success sending message upstream, updating FCM message Id',
          res
        )
      })
      .catch(err => {
        this.logger.error('Failed to send notification', err)
        if (this.upstreamResends++ < DefaultMaxUpstreamResends)
          this.sendNotification(notification, subjectId, projectId)
      })
  }

  private format(
    notification: SingleNotification,
    sourceId
  ): { notification: SingleNotification; notificationDto: FcmNotificationDto } {
    const taskInfo = notification.task
    const endTime = taskInfo.timestamp + taskInfo.completionWindow
    const timeUntilEnd = endTime - notification.timestamp

    const ttl =
      timeUntilEnd > 0
        ? getSeconds({ milliseconds: timeUntilEnd })
        : getSeconds({ minutes: this.ttlMinutes })

    return {
      notification,
      notificationDto: {
        title: notification.title,
        body: notification.text,
        ttlSeconds: ttl,
        sourceId: sourceId,
        type: taskInfo.name,
        sourceType: DefaultSourcePrefix,
        appPackage: DefaultPackageName,
        scheduledTime: new Date(notification.timestamp)
      }
    }
  }

  permissionCheck(): Promise<void> {
    if (!this.platform.is('ios')) return Promise.resolve()
    return this.firebase
      .hasPermission()
      .then(res => (res.isEnabled ? true : this.firebase.grantPermission()))
  }

  setLastNotificationUpdate(): Promise<void> {
    return this.storage.set(
      this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE,
      Date.now()
    )
  }

  getLastNotificationUpdate() {
    return this.storage.get(this.NOTIFICATION_STORAGE.LAST_NOTIFICATION_UPDATE)
  }

  resetResends() {
    this.upstreamResends = 0
  }
}
