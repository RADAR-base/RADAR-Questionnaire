import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { OAuth2Client } from '@byteowls/capacitor-oauth2'

import {
  DefaultManagementPortalURI,
  DefaultSourceTypeModel,
  DefaultRefreshTokenURI,
  DefaultOryAuthOptions
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { SubjectConfigService } from '../../../core/services/config/subject-config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { TokenService } from '../../../core/services/token/token.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { MetaToken, OAuthToken } from '../../../shared/models/token'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private URI_base: string

  constructor(
    private http: HttpClient,
    private token: TokenService,
    private config: ConfigService,
    private logger: LogService,
    private analytics: AnalyticsService,
    private subjectConfig: SubjectConfigService
  ) { }

  reset() {
    this.config.resetAll()
  }

  authenticate(method: string, authObj: any) {
    switch (method) {
      case 'qr':
      case 'token':
        return this.handleMetaTokenAuth(authObj)
      case 'ory':
        return this.handleOryAuth(authObj)
      default:
        return Promise.reject(
          new Error(`Unknown authentication method: ${method}`)
        )
    }
  }

  private handleMetaTokenAuth(authObj: any) {
    return this.metaTokenUrlAuth(authObj)
      .then(refreshToken => this.completeAuthentication(refreshToken))
      .catch(err => {
        this.logger.error('MetaTokenUrlAuth failed', err)
        throw err
      })
  }

  private handleOryAuth(authObj: any) {
    return this.oryAuth(authObj)
      .then(response => this.completeAuthentication(response.refresh_token))
      .catch(err => {
        this.logger.error('OryAuth failed', err)
        throw err
      })
  }

  private completeAuthentication(refreshToken: string) {
    return this.registerToken(refreshToken)
      .then(() => this.registerAsSource())
      .then(() => this.registerToken(refreshToken))
  }

  private oryAuth(authObj: string) {
    const parsedUrl = new URL(authObj)
    const baseUrl = parsedUrl.origin
    const options = {
      ...DefaultOryAuthOptions,
      authorizationBaseUrl: `${baseUrl}/hydra/oauth2/auth`,
      accessTokenEndpoint: `${baseUrl}/hydra/oauth2/token`
    }

    return this.token
      .setURI(baseUrl)
      .then(() => this.analytics.setUserProperties({ baseUrl }))
      .then(() => this.token.setTokenEndpoint(options.accessTokenEndpoint))
      .then(() => OAuth2Client.authenticate(options))
      .then(response => response.access_token_response)
  }

  oryLogout() {
    return OAuth2Client.logout(DefaultOryAuthOptions)
  }

  private metaTokenUrlAuth(authObj: string) {
    return this.getRefreshTokenFromUrl(authObj)
      .then(body => {
        const { refreshToken, baseUrl } = body
        this.logger.log(`Retrieved refresh token from ${baseUrl}`, body)

        return this.token
          .setURI(baseUrl)
          .then(() =>
            this.token.setTokenEndpoint(
              `${baseUrl}${DefaultManagementPortalURI}${DefaultRefreshTokenURI}`
            )
          )
          .then(() => this.analytics.setUserProperties({ baseUrl }))
          .then(() => this.updateURI())
          .then(() => refreshToken)
      })
      .catch(err => {
        this.logger.error('Failed to retrieve refresh token', err)
        throw err
      })
  }

  private updateURI() {
    return this.token.getURI().then(uri => {
      this.URI_base = `${uri}${DefaultManagementPortalURI}`
    })
  }

  private registerToken(registrationToken: string): Promise<OAuthToken> {
    return this.token.register(this.token.getRefreshParams(registrationToken))
  }

  private getRefreshTokenFromUrl(url: string): Promise<MetaToken> {
    return this.http.get<MetaToken>(url).toPromise()
  }

  initSubjectInformation() {
    return Promise.all([
      this.token.getURI(),
      this.subjectConfig.pullSubjectInformation()
    ]).then(([baseUrl, subjectInformation]) => {
      const config = {
        projectId: subjectInformation.project.projectName,
        subjectId: subjectInformation.login,
        sourceId: this.getSourceId(subjectInformation),
        humanReadableId: subjectInformation.externalId,
        enrolmentDate: new Date(subjectInformation.createdDate).getTime(),
        baseUrl,
        attributes: subjectInformation.attributes
      }
      return this.config.setAll(config)
    })
  }

  private getSourceId(response: any): string {
    const source = response.sources.find(
      s => s.sourceTypeModel === DefaultSourceTypeModel
    )
    return source ? source.sourceId : 'Device not available'
  }

  private registerAsSource() {
    return this.subjectConfig.registerSourceToSubject()
  }
}
