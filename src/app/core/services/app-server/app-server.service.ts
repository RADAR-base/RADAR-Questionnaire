import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as moment from 'moment-timezone'
import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'
import * as urljoin from 'url-join'

import {
  DefaultAppServerURL,
  DefaultRequestJSONContentType
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import {
  FcmNotificationDto,
  FcmNotificationError
} from '../../../shared/models/app-server'
import { SingleNotification } from '../../../shared/models/notification-handler'
import { Task } from '../../../shared/models/task'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { GlobalStorageService } from '../storage/global-storage.service'
import { TokenService } from '../token/token.service'

@Injectable()
export class AppServerService {
  private APP_SERVER_URL
  SUBJECT_PATH = 'users'
  PROJECT_PATH = 'projects'
  GITHUB_CONTENT_PATH = 'github/content'
  QUESTIONNAIRE_SCHEDULE_PATH = 'questionnaire/schedule'
  QUESTIONNAIRE_TASK = 'questionnaire/task'
  QUESTIONNAIRE_STATE_EVENTS_PATH = 'state_events'
  NOTIFICATIONS_PATH = 'messaging/notifications'
  STATE_EVENTS_PATH = 'state_events'
  private tokenSubscription: Subscription = null

  constructor(
    public storage: GlobalStorageService,
    public subjectConfig: SubjectConfigService,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService,
    private token: TokenService,
    private http: HttpClient
  ) {}

  init() {
    console.log('Class: AppServerService, Function: init, Line 56 ' , );
    // NOTE: Initialising ensures project and subject exists in the app server
    return this.updateAppServerURL()
      .then(() => {
        console.log('Class: AppServerService, Function: , Line 60 ' , );
        return Promise.all([
          this.subjectConfig.getParticipantLogin(),
          this.subjectConfig.getProjectName(),
          this.subjectConfig.getEnrolmentDate(),
          this.subjectConfig.getParticipantAttributes(),
          this.getFCMToken()
        ])
      })
      .then(([subjectId, projectId, enrolmentDate, attributes, fcmToken]) => {
        console.log('Class: AppServerService, Function: , Line 70 ' , subjectId, projectId, enrolmentDate, attributes, fcmToken);
        return this.addProjectIfMissing(projectId)
          .then(() =>
            this.addSubjectIfMissing(
              subjectId,
              projectId,
              enrolmentDate,
              attributes,
              fcmToken
            )
          )
          .then(httpRes => {
            console.log('Class: AppServerService, Function: , Line 82 ' , );
            if (this.tokenSubscription !== null) {
              this.tokenSubscription.unsubscribe()
            }
            this.tokenSubscription = this.storage
              .observe(StorageKeys.FCM_TOKEN)
              .pipe(filter(t => t && t !== fcmToken))
              .subscribe(newFcmToken =>
                this.addSubjectIfMissing(
                  subjectId,
                  projectId,
                  enrolmentDate,
                  attributes,
                  newFcmToken
                )
              )
            return httpRes
          })
      })
      .catch(e => {
        console.log('Class: AppServerService, Function: , Line 102 ' , );
        throw new HttpErrorResponse({
          status: e.status,
          statusText: 'Unable to connect to the appserver.'
        })
      })
  }

  getHeaders() {
    return Promise.all([
      this.APP_SERVER_URL ? this.APP_SERVER_URL : this.updateAppServerURL(),
      this.token.refresh()
    ]).then(([, tokens]) =>
      new HttpHeaders()
        .set('Authorization', 'Bearer ' + tokens.access_token)
        .set('Content-Type', DefaultRequestJSONContentType)
    )
  }

  getProject(projectId): Promise<any> {
    return this.getHeaders().then(headers =>
      this.http
        .get(urljoin(this.APP_SERVER_URL, this.PROJECT_PATH, projectId), {
          headers
        })
        .toPromise()
    )
  }

  addProjectIfMissing(projectId): Promise<any> {
    return this.getProject(projectId).catch(e => {
      if (e.status == 404) return this.addProjectToServer(projectId)
      else throw e
    })
  }

  addProjectToServer(projectId) {
    return this.getHeaders().then(headers =>
      this.http
        .post(
          urljoin(this.APP_SERVER_URL, this.PROJECT_PATH),
          { projectId },
          { headers }
        )
        .toPromise()
    )
  }

  getSubject(projectId, subjectId): Promise<any> {
    return this.getHeaders().then(headers =>
      this.http
        .get(
          urljoin(
            this.APP_SERVER_URL,
            this.PROJECT_PATH,
            projectId,
            this.SUBJECT_PATH,
            subjectId
          ),
          { headers }
        )
        .toPromise()
    )
  }

  addSubjectIfMissing(
    subjectId,
    projectId,
    enrolmentDate,
    attributes,
    fcmToken
  ): Promise<any> {
    // NOTE: Adds subject if missing, updates subject if it exists
    return this.getSubject(projectId, subjectId)
      .then(subject =>
        this.updateSubject(subject, {
          fcmToken,
          lastOpened: new Date(),
          timezone: moment.tz.guess(),
          language: this.localization.getLanguage().value,
          attributes
        })
      )
      .catch(e => {
        if (e.status == 404)
          return this.addSubjectToServer(
            subjectId,
            projectId,
            enrolmentDate,
            fcmToken,
            attributes
          )
        else throw e
      })
  }

  addSubjectToServer(
    subjectId,
    projectId,
    enrolmentDate,
    fcmToken,
    attributes
  ) {
    return this.getHeaders().then(headers =>
      this.http
        .post(
          urljoin(
            this.APP_SERVER_URL,
            this.PROJECT_PATH,
            projectId,
            this.SUBJECT_PATH
          ),
          {
            enrolmentDate: new Date(enrolmentDate),
            projectId,
            subjectId,
            fcmToken,
            timezone: moment.tz.guess(),
            language: this.localization.getLanguage().value,
            attributes
          },
          { headers, params: { forceFcmToken: 'true' } }
        )
        .toPromise()
    )
  }

  updateSubject(subject, properties) {
    return this.getHeaders().then(headers => {
      const updatedSubject = Object.assign(subject, properties)
      const projectId = subject.projectId
      const subjectId = subject.subjectId
      return this.http
        .put(
          urljoin(
            this.APP_SERVER_URL,
            this.PROJECT_PATH,
            projectId,
            this.SUBJECT_PATH,
            subjectId
          ),
          updatedSubject,
          { headers, params: { forceFcmToken: 'true' } }
        )
        .toPromise()
    })
  }

  // NOTE: This method fetches from Github through the App Server.
  fetchFromGithub(githubUrl: string) {
    console.log('Class: AppServerService, Function: fetchFromGithub, Line 252 ' , );
    return this.getHeaders().then(headers => {
      return this.http
        .get(urljoin(this.APP_SERVER_URL, this.GITHUB_CONTENT_PATH), {
          headers,
          params: { url: githubUrl }
        })
        .toPromise()
    })
  }

  getSchedule(): Promise<any> {
    console.log('Class: AppServerService, Function: getSchedule, Line 264 ' , );
    return Promise.all([
      this.subjectConfig.getParticipantLogin(),
      this.subjectConfig.getProjectName()
    ]).then(([subjectId, projectId]) => {
      return this.getHeaders().then(headers =>
        this.http
          .get(
            urljoin(
              this.APP_SERVER_URL,
              this.PROJECT_PATH,
              projectId,
              this.SUBJECT_PATH,
              subjectId,
              this.QUESTIONNAIRE_SCHEDULE_PATH
            ),
            { headers }
          )
          .toPromise()
      )
    })
  }

  getScheduleForDates(startTime: Date, endTime: Date): Promise<any> {
    console.log('Class: AppServerService, Function: getScheduleForDates, Line 288 ' , );
    return Promise.all([
      this.subjectConfig.getParticipantLogin(),
      this.subjectConfig.getProjectName()
    ]).then(([subjectId, projectId]) => {
      return this.getHeaders().then(headers =>
        this.http
          .get(
            urljoin(
              this.APP_SERVER_URL,
              this.PROJECT_PATH,
              projectId,
              this.SUBJECT_PATH,
              subjectId,
              this.QUESTIONNAIRE_SCHEDULE_PATH
            ),
            {
              headers,
              params: {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
              }
            }
          )
          .toPromise()
          .catch(e => [])
      )
    })
  }

  generateSchedule(): Promise<any> {
    console.log('Class: AppServerService, Function: generateSchedule, Line 312 ' , );
    return Promise.all([
      this.subjectConfig.getParticipantLogin(),
      this.subjectConfig.getProjectName()
    ]).then(([subjectId, projectId]) => {
      return this.getHeaders().then(headers =>
        this.http
          .post(
            urljoin(
              this.APP_SERVER_URL,
              this.PROJECT_PATH,
              projectId,
              this.SUBJECT_PATH,
              subjectId,
              this.QUESTIONNAIRE_SCHEDULE_PATH
            ),
            { headers }
          )
          .toPromise()
      )
    })
  }

  pullAllPublishedNotifications(subject) {
    console.log('Class: AppServerService, Function: pullAllPublishedNotifications, Line 335 subject' , subject);
    return this.getHeaders().then(headers =>
      this.http
        .get(
          urljoin(
            this.getAppServerURL(),
            this.PROJECT_PATH,
            subject.projectId,
            this.SUBJECT_PATH,
            subject.subjectId,
            this.NOTIFICATIONS_PATH
          ),
          { headers }
        )
        .toPromise()
    )
  }

  deleteNotification(subject, notification: SingleNotification) {
    console.log('Class: AppServerService, Function: deleteNotification, Line 353 subject, notification' , subject, notification);
    return this.getHeaders().then(headers =>
      this.http
        .delete(
          urljoin(
            this.getAppServerURL(),
            this.PROJECT_PATH,
            subject.projectId,
            this.SUBJECT_PATH,
            subject.subjectId,
            this.NOTIFICATIONS_PATH,
            notification.id.toString()
          ),
          { headers }
        )
        .toPromise()
    )
  }

  deleteNotificationsBatch(subject, notifications: SingleNotification[]) {
    console.log('Class: AppServerService, Function: deleteNotificationsBatch, Line 382 subject, notifications' , subject, notifications);
    return this.getHeaders().then(headers =>
      this.http
        .delete(
          urljoin(
            this.getAppServerURL(),
            this.PROJECT_PATH,
            subject.projectId,
            this.SUBJECT_PATH,
            subject.subjectId,
            this.NOTIFICATIONS_PATH,
            "batch"
            // notification.id.toString()
          ),
          notifications,
          { headers }
        )
        .toPromise()
    )
  }

  updateTaskState(taskId, state) {
    console.log('Class: AppServerService, Function: updateTaskState, Line 372 taskId, state' , taskId, state);
    return Promise.all([
      this.subjectConfig.getParticipantLogin(),
      this.subjectConfig.getProjectName()
    ]).then(([subjectId, projectId]) => {
      return this.getHeaders().then(headers =>
        this.http
          .post(
            urljoin(
              this.getAppServerURL(),
              this.PROJECT_PATH,
              projectId,
              this.SUBJECT_PATH,
              subjectId,
              this.QUESTIONNAIRE_SCHEDULE_PATH,
              taskId.toString(),
              this.QUESTIONNAIRE_STATE_EVENTS_PATH
            ),
            {
              taskId: taskId,
              state: state,
              time: new Date(),
              associatedInfo: ''
            },
            { headers }
          )
          .toPromise()
      )
    })
  }

  updateNotificationState(subject, notificationId, state) {
    console.log('Class: AppServerService, Function: updateNotificationState, Line 403 subject, notificationId, state' , subject, notificationId, state);
    return this.getHeaders().then(headers =>
      this.http
        .post(
          urljoin(
            this.getAppServerURL(),
            this.PROJECT_PATH,
            subject.projectId,
            this.SUBJECT_PATH,
            subject.subjectId,
            this.NOTIFICATIONS_PATH,
            notificationId.toString(),
            this.STATE_EVENTS_PATH
          ),
          { notificationId: notificationId, state: state, time: new Date() },
          { headers }
        )
        .toPromise()
    )
  }

  addNotificationsBatch(notifications, subjectId, projectId): Promise<any> {
    return this.getHeaders().then(headers =>
      this.http
        .post(
          urljoin(
            this.getAppServerURL(),
            this.PROJECT_PATH,
            projectId,
            this.SUBJECT_PATH,
            subjectId,
            this.NOTIFICATIONS_PATH,
            "batch"
          ),
          // notification.notificationDto,
          notifications,
          { headers, observe: 'response' }
        )
        .toPromise()
        .then((res: HttpResponse<FcmNotificationDto>) => {
          this.logger.log('Successfully sent! Updating notification Id')
          return res.body
        })
        .catch((err: HttpErrorResponse) => {
          this.logger.log('Http request returned an error: ' + err.message)
          // const data: FcmNotificationError = err.error
          // if (err.status == 409) {
          //   this.logger.log(
          //     'Notification already exists, storing notification data..'
          //   )
          //   return data.dto ? data.dto : notification.notification
          // }
          // return this.logger.error('Failed to send notification', err)
        })
    )
  }

  // public addNotification(notification, subjectId, projectId): Promise<any> {
  //   console.log('Class: AppServerService, Function: addNotification, Line 460 notification, subjectId, projectId' , notification, subjectId, projectId);
  //   return this.getHeaders().then(headers =>
  //     this.http
  //       .post(
  //         urljoin(
  //           this.getAppServerURL(),
  //           this.PROJECT_PATH,
  //           projectId,
  //           this.SUBJECT_PATH,
  //           subjectId,
  //           this.NOTIFICATIONS_PATH
  //         ),
  //         notification.notificationDto,
  //         { headers, observe: 'response' }
  //       )
  //       .toPromise()
  //       .then((res: HttpResponse<FcmNotificationDto>) => {
  //         console.log('Class: AppServerService, Function: , Line 482 res' , res);
  //         this.logger.log('Successfully sent! Updating notification Id')
  //         return res.body
  //       })
  //       .catch((err: HttpErrorResponse) => {
  //         console.log('Class: AppServerService, Function: , Line 487 err' , err);
  //         this.logger.log('Http request returned an error: ' + err.message)
  //         const data: FcmNotificationError = err.error
  //         if (err.status == 409) {
  //           this.logger.log(
  //             'Notification already exists, storing notification data..'
  //           )
  //           return data.dto ? data.dto : notification.notification
  //         }
  //         return this.logger.error('Failed to send notification', err)
  //       })
  //   )
  // }

  getFCMToken() {
    return this.storage.get(StorageKeys.FCM_TOKEN)
  }

  updateAppServerURL() {
    return this.remoteConfig
      .forceFetch()
      .then(config =>
        config.getOrDefault(ConfigKeys.APP_SERVER_URL, DefaultAppServerURL)
      )
      .then(url => (this.APP_SERVER_URL = url))
  }

  getAppServerURL() {
    return this.APP_SERVER_URL
  }
}
