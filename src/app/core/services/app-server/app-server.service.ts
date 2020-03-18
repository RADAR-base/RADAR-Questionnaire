import { Injectable } from '@angular/core'
import * as Swagger from 'swagger-client'

import { DefaultAppServerURL } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LocalizationService } from '../misc/localization.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class AppServerService {
  private API_DOCS_URL = '/v3/api-docs'

  RADAR_USER_CONTROLLER = 'radar-user-controller'
  RADAR_PROJECT_CONTROLLER = 'radar-project-controller'
  apiClient: any

  constructor(
    public storage: StorageService,
    public config: SubjectConfigService,
    public logger: LogService,
    public remoteConfig: RemoteConfigService,
    public localization: LocalizationService
  ) {
    this.initApiClient()
  }

  initApiClient() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(ConfigKeys.APP_SERVER_URL, DefaultAppServerURL)
      )
      .then(url =>
        Swagger({ url: url + this.API_DOCS_URL })
          .then(client => (this.apiClient = client))
          .catch(e => this.logger.error('Error pulling API docs', e))
      )
  }

  getApiClient() {
    if (this.apiClient) return Promise.resolve(this.apiClient)
    else this.initApiClient().then(() => this.apiClient)
  }

  checkProjectAndSubjectExistElseCreate(): Promise<any> {
    return this.checkProjectExistsElseCreate().then(() =>
      this.checkSubjectExistsElseCreate()
    )
  }

  checkProjectExistsElseCreate(): Promise<any> {
    return this.config.getProjectName().then(projectId => {
      return this.apiClient.apis[this.RADAR_PROJECT_CONTROLLER]
        .getProjectsUsingProjectId({ projectId })
        .catch(e => {
          if (e.status == 404) return this.addProjectToServer(projectId)
          else return Promise.reject(e)
        })
    })
  }

  addProjectToServer(projectId) {
    return this.apiClient.apis[this.RADAR_PROJECT_CONTROLLER].addProject({
      projectId
    })
  }

  checkSubjectExistsElseCreate(): Promise<any> {
    return Promise.all([
      this.config.getParticipantLogin(),
      this.config.getProjectName(),
      this.config.getEnrolmentDate()
    ]).then(([subjectId, projectId, enrolmentDate]) => {
      return this.apiClient.apis[this.RADAR_USER_CONTROLLER]
        .getRadarUserUsingSubjectId({ subjectId })
        .then(res => res.body)
        .catch(e => {
          if (e.status == 404)
            return this.addSubjectToServer(subjectId, projectId, enrolmentDate)
          else Promise.reject(e)
        })
    })
  }

  addSubjectToServer(subjectId, projectId, enrolmentDate, fcmToken?) {
    return this.apiClient.apis[this.RADAR_USER_CONTROLLER].addUser({
      enrolmentDate: new Date(enrolmentDate),
      projectId,
      subjectId,
      fcmToken,
      timezone: new Date().getTimezoneOffset(),
      language: this.localization.getLanguage().value
    })
  }
}
