import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { OAuth2Client } from '@byteowls/capacitor-oauth2'

import {
  DefaultManagementPortalURI,
  DefaultSourceTypeModel
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { SubjectConfigService } from '../../../core/services/config/subject-config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { TokenService } from '../../../core/services/token/token.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { MetaToken, OAuthToken } from '../../../shared/models/token'
import { isValidURL } from '../../../shared/utilities/form-validators'
import { DefaultOryAuthOptions } from 'src/assets/data/defaultConfig'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  URI_base: string

  constructor(
    public http: HttpClient,
    private token: TokenService,
    private config: ConfigService,
    private logger: LogService,
    private analytics: AnalyticsService,
    private subjectConfig: SubjectConfigService
  ) {}

  reset() {
    this.config.resetAll()
  }

  authenticate(method, authObj) {
    switch (method) {
      case 'qr':
      case 'token':
        return this.metaTokenUrlAuth(authObj).then(refreshToken =>
          this.registerToken(refreshToken)
            .then(() => this.registerAsSource())
            .then(() => this.registerToken(refreshToken))
        )
      case 'ory':
        return this.oryAuth(authObj).then(response =>
          this.token.setTokens(authObj).then(() => this.registerAsSource())
        )
    }
  }

  oryAuth(authObj) {
    const parsedUrl = new URL(authObj)
    const baseUrl = parsedUrl.origin
    const projectId = parsedUrl.searchParams.get('projectId')
    const options = DefaultOryAuthOptions
    options.authorizationBaseUrl = baseUrl + '/oauth2/auth'
    options.accessTokenEndpoint = baseUrl + '/oauth2/token'
    return OAuth2Client.authenticate(DefaultOryAuthOptions).then(
      response => response.access_token_response
    )
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

  updateURI() {
    return this.token.getURI().then(uri => {
      this.URI_base = uri + DefaultManagementPortalURI
    })
  }

  registerToken(registrationToken): Promise<OAuthToken> {
    return this.token.register(this.token.getRefreshParams(registrationToken))
  }

  getRefreshTokenFromUrl(url): Promise<MetaToken> {
    return this.http.get(url).toPromise()
  }

  initSubjectInformation() {
    return Promise.all([
      this.token.getURI(),
      this.subjectConfig.pullSubjectInformation()
    ]).then(([baseUrl, subjectInformation]) => {
      return this.config.setAll({
        projectId: subjectInformation.project.projectName,
        subjectId: subjectInformation.login,
        sourceId: this.getSourceId(subjectInformation),
        humanReadableId: subjectInformation.externalId,
        enrolmentDate: new Date(subjectInformation.createdDate).getTime(),
        baseUrl: baseUrl,
        attributes: subjectInformation.attributes
      })
    })
  }

  getSourceId(response) {
    const source = response.sources.find(
      s => s.sourceTypeModel === DefaultSourceTypeModel
    )
    return source !== undefined ? source.sourceId : 'Device not available'
  }

  registerAsSource() {
    return this.subjectConfig.registerSourceToSubject()
  }
}
