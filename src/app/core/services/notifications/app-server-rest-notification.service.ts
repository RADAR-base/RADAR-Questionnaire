import { Injectable } from '@angular/core'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Platform } from 'ionic-angular'
import * as Swagger from 'swagger-client'

import {
  DefaultMaxUpstreamResends,
  DefaultPackageName,
  DefaultSourcePrefix
} from '../../../../assets/data/defaultConfig'
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

@Injectable()
export class AppServerRestNotificationService extends FcmNotificationService {
  private APP_SERVER_URL = 'http://localhost:8080'
  private API_DOCS_URL = '/v3/api-docs'

  FCM_NOTIFICATION_CONTROLLER = 'fcm-notification-controller'
  RADAR_USER_CONTROLLER = 'radar-user-controller'
  RADAR_PROJECT_CONTROLLER = 'radar-project-controller'
  apiClient

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
    this.initApiClient()
  }

  initApiClient() {
    return Swagger({ url: this.APP_SERVER_URL + this.API_DOCS_URL })
      .then(client => (this.apiClient = client))
      .catch(e => this.logger.error('Error pulling API docs', e))
  }

  getApiClient() {
    if (this.apiClient) return Promise.resolve(this.apiClient)
    else this.initApiClient().then(() => this.apiClient)
  }

  getSubjectDetails() {
    return this.checkProjectAndSubjectExistElseCreate()
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
    return this.apiClient.apis[
      this.FCM_NOTIFICATION_CONTROLLER
    ].deleteNotificationsForUser({
      subjectId: user.subjectId,
      projectId: user.projectId
    })
  }

  cancelSingleNotification(user, notificationId) {
    return this.apiClient.apis[this.FCM_NOTIFICATION_CONTROLLER]
      .deleteNotificationUsingProjectIdAndSubjectIdAndNotificationId({
        subjectId: user.subjectId,
        projectId: user.projectId,
        id: notificationId
      })
      .then(() =>
        console.log('Success cancelling notification ' + notificationId)
      )
  }

  private checkProjectAndSubjectExistElseCreate(): Promise<any> {
    return this.checkProjectExistsElseCreate().then(() =>
      this.checkSubjectExistsElseCreate()
    )
  }

  private checkProjectExistsElseCreate(): Promise<any> {
    return this.config.getProjectName().then(projectId => {
      return this.apiClient.apis[this.RADAR_PROJECT_CONTROLLER]
        .getProjectsUsingProjectId({ projectId })
        .catch(e => {
          if (e.status == 404) {
            return this.apiClient.apis[
              this.RADAR_PROJECT_CONTROLLER
            ].addProject({
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
      return this.apiClient.apis[this.RADAR_USER_CONTROLLER]
        .getRadarUserUsingSubjectId({ subjectId })
        .then(res => res.body)
        .catch(e =>
          e.status == 404
            ? this.apiClient.apis[this.RADAR_USER_CONTROLLER].addUser({
                enrolmentDate: new Date(enrolmentDate),
                projectId,
                subjectId,
                fcmToken: this.FCM_TOKEN,
                timezone: new Date().getTimezoneOffset(),
                language: this.localization.getLanguage().value
              })
            : Promise.reject(e)
        )
    })
  }

  private sendNotification(notification, subjectId, projectId): Promise<any> {
    return this.apiClient.apis[this.FCM_NOTIFICATION_CONTROLLER]
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
          'Successfully sent to the app server, updating notification Id',
          res
        )
      })
      .catch(err => {
        this.logger.error('Failed to send notification', err)
        if (this.upstreamResends++ < DefaultMaxUpstreamResends)
          this.sendNotification(notification, subjectId, projectId)
      })
  }

  private format(notification: SingleNotification, sourceId) {
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
        sourceId: sourceId,
        type: taskInfo.name,
        sourceType: DefaultSourcePrefix,
        appPackage: DefaultPackageName,
        scheduledTime: new Date(notification.timestamp)
      }
    }
  }
}
