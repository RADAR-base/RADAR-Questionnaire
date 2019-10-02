import 'rxjs/add/operator/toPromise'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultManagementPortalURI,
  DefaultRefreshTokenRequestBody,
  DefaultRequestEncodedContentType,
  DefaultRequestJSONContentType,
  DefaultSourceTypeModel,
  DefaultSourceTypeRegistrationBody,
  DefaultSubjectsURI
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { TokenService } from '../../../core/services/token/token.service'
import { MetaToken } from '../../../shared/models/token'
import { isValidURL } from '../../../shared/utilities/form-validators'

@Injectable()
export class AuthService {
  URI_base: string

  constructor(
    public http: HttpClient,
    protected token: TokenService,
    protected config: ConfigService,
    protected logger: LogService,
    protected analytics: AnalyticsService
  ) {}

  authenticate(authObj) {
    return (isValidURL(authObj)
      ? this.metaTokenUrlAuth(authObj)
      : this.metaTokenJsonAuth(authObj)
    ).then(refreshToken => {
      return this.registerToken(refreshToken)
        .then(() => this.registerAsSource())
        .then(() => this.registerToken(refreshToken))
    })
  }

  metaTokenUrlAuth(authObj) {
    // NOTE: Meta QR code and new QR code
    return this.getRefreshTokenFromUrl(authObj).then((body: any) => {
      this.logger.log(`Retrieved refresh token from ${body.baseUrl}`, body)
      const refreshToken = body.refreshToken
      return this.token
        .setURI(body.baseUrl)
        .then(baseUrl => this.analytics.setUserProperties({ baseUrl }))
        .catch()
        .then(() => this.updateURI())
        .then(() => refreshToken)
    })
  }

  metaTokenJsonAuth(authObj) {
    // NOTE: Old QR codes: containing refresh token as JSON
    return this.updateURI()
      .then(() => JSON.parse(authObj).refreshToken)
  }

  updateURI() {
    return this.token.getURI().then(uri => {
      this.URI_base = uri + DefaultManagementPortalURI
    })
  }

  registerToken(registrationToken): Promise<void> {
    const refreshBody = DefaultRefreshTokenRequestBody + registrationToken
    return this.token.register(refreshBody)
  }

  getRefreshTokenFromUrl(url): Promise<MetaToken> {
    return this.http.get(url).toPromise()
  }

  getSubjectURI(subject) {
    return this.URI_base + DefaultSubjectsURI + subject
  }

  getSubjectInformation(): Promise<any> {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestEncodedContentType),
      this.token.getDecodedSubject(),
    ]).then(([headers, subject]) =>
      this.http.get(this.getSubjectURI(subject), { headers }).toPromise()
    )
  }

  initSubjectInformation() {
    return Promise.all([
      this.token.getURI(),
      this.getSubjectInformation()
    ]).then(([baseUrl, subjectInformation]) => {
      return this.config.setAll({
        projectId: subjectInformation.project.projectName,
        subjectId: subjectInformation.login,
        sourceId: this.getSourceId(subjectInformation),
        humanReadableId: subjectInformation.externalId,
        enrolmentDate: new Date(subjectInformation.createdDate).getTime(),
        baseUrl: baseUrl,
      })
    })
  }

  getSourceId(response) {
    const source = response.sources.find(s => s.sourceTypeModel === DefaultSourceTypeModel)
    return source !== undefined ? source.sourceId : 'Device not available'
  }

  registerAsSource() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestJSONContentType),
      this.token.getDecodedSubject()
    ]).then(([headers, subject]) =>
      this.http
        .post(
          this.getSubjectURI(subject) + '/sources',
          DefaultSourceTypeRegistrationBody,
          {
            headers
          }
        )
        .toPromise()
    )
  }
}
