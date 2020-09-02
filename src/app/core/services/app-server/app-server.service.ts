import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as moment from 'moment-timezone'

import {
  DefaultAppServerURL,
  DefaultRequestJSONContentType
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from '../token/token.service'

@Injectable()
export class AppServerService {
  private APP_SERVER_URL = ''

  RADAR_USER_CONTROLLER = 'radar-user-controller'
  RADAR_PROJECT_CONTROLLER = 'radar-project-controller'
  MAX_API_RETRIES = 10
  apiClient: any

  constructor(
    public storage: StorageService,
    public subjectConfig: SubjectConfigService,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService,
    private token: TokenService,
    private http: HttpClient
  ) {}

  init() {
    // NOTE: Initialising ensures project and subject exists in the app server
    return this.updateAppServerURL()
      .then(() => this.addProjectIfMissing())
      .then(() => this.addSubjectIfMissing())
  }

  getHeaders() {
    return Promise.all([
      this.updateAppServerURL(),
      this.token.getTokens()
    ]).then(([, tokens]) =>
      new HttpHeaders()
        .set('Authorization', 'Bearer ' + tokens.access_token)
        .set('Content-Type', DefaultRequestJSONContentType)
    )
  }

  getProject(projectId): Promise<any> {
    return this.getHeaders().then(headers =>
      this.http
        .get(`${this.APP_SERVER_URL}/projects/ ${projectId}`, {
          headers
        })
        .toPromise()
    )
  }

  addProjectIfMissing(): Promise<any> {
    // NOTE: Adding retries here because of random 'Failed to load resource'
    let attempts = 0
    return this.subjectConfig.getProjectName().then(projectId => {
      return this.getProject(projectId).catch(e => {
        if (e.status == 404) return this.addProjectToServer(projectId)
        else if (++attempts < this.MAX_API_RETRIES)
          return this.addProjectIfMissing()
      })
    })
  }

  addProjectToServer(projectId) {
    return this.getHeaders().then(headers =>
      this.http
        .post(`${this.APP_SERVER_URL}/projects/`, { projectId }, { headers })
        .toPromise()
    )
  }

  getSubject(subjectId): Promise<any> {
    return this.getHeaders()
      .then(headers =>
        this.http
          .get(`${this.APP_SERVER_URL}/users/${subjectId}`, {
            headers
          })
          .toPromise()
      )
      .then(res => res['body'])
  }

  addSubjectIfMissing(): Promise<any> {
    return Promise.all([
      this.subjectConfig.getParticipantLogin(),
      this.subjectConfig.getProjectName(),
      this.subjectConfig.getEnrolmentDate(),
      this.getFCMToken()
    ]).then(([subjectId, projectId, enrolmentDate, fcmToken]) => {
      return this.getSubject(subjectId).catch(e => {
        if (e.status == 404)
          return this.addSubjectToServer(
            subjectId,
            projectId,
            enrolmentDate,
            fcmToken
          )
        else Promise.reject(e)
      })
    })
  }

  addSubjectToServer(subjectId, projectId, enrolmentDate, fcmToken) {
    return this.getHeaders().then(headers =>
      this.http.post(
        `${this.APP_SERVER_URL}/projects/${projectId}/users/`,
        {
          enrolmentDate: new Date(enrolmentDate),
          projectId,
          subjectId,
          fcmToken,
          timezone: moment.tz.guess(),
          language: this.localization.getLanguage().value
        },
        { headers }
      )
    )
  }

  updateSubject(properties) {
    return Promise.all([
      this.subjectConfig.getProjectName(),
      this.subjectConfig.getParticipantLogin(),
      this.getHeaders()
    ]).then(([projectId, subjectId, headers]) =>
      this.getSubject(subjectId).then(res => {
        const user = res.body
        const updatedUser = Object.assign(user, properties)
        return this.http.put(
          `${this.APP_SERVER_URL}/projects/${projectId}/users/${subjectId}`,
          updatedUser,
          { headers }
        )
      })
    )
  }

  getFCMToken() {
    return this.storage.get(StorageKeys.FCM_TOKEN)
  }

  updateAppServerURL() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(ConfigKeys.APP_SERVER_URL, DefaultAppServerURL)
      )
      .then(url => (this.APP_SERVER_URL = url))
  }

  getAppServerURL() {
    return this.APP_SERVER_URL
  }
}
