import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'


import { ConfigService } from '../../../core/services/config/config.service'
import { SubjectConfigService } from '../../../core/services/config/subject-config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { TokenService } from '../../../core/services/token/token.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { AuthType } from '../../../shared/models/auth'
import { AuthService } from './auth.service'


@Injectable({
  providedIn: 'root',
})
export class OryAuthService extends AuthService {
  constructor(
    public http: HttpClient,
    public token: TokenService,
    public config: ConfigService,
    public logger: LogService,
    public analytics: AnalyticsService,
    public subjectConfig: SubjectConfigService
  ) {
    super(http, token, config, logger, analytics, subjectConfig)
  }

  authenticate(authObj: any): Promise<any> {
    this.token.setAuthType(AuthType.ORY)
      .then(() => this.token.updateTokenServiceByType(AuthType.ORY))
    let baseUrl: string
    let refreshToken: string

    if (typeof authObj === 'string') {
      try {
        const url = new URL(authObj)
        const encodedData = url.searchParams.get('data')
        const referrer = url.searchParams.get('referrer')
        if (!referrer) {
          throw new Error('Referrer URL is missing')
        }
        baseUrl = new URL(referrer).origin
        if (!encodedData) {
          throw new Error('Ory auth data is missing')
        }
        const data = JSON.parse(decodeURIComponent(encodedData))
        if (!data.refresh_token) {
          throw new Error('Refresh token is missing from auth data')
        }
        refreshToken = data.refresh_token
      } catch (e) {
        throw new Error(`Invalid auth URL format: ${e.message}`)
      }
    } else {
      if (!authObj.url) {
        throw new Error('Base URL is missing from auth object')
      }
      try {
        baseUrl = new URL(authObj.url).origin
      } catch (e) {
        throw new Error(`Invalid base URL format: ${authObj.url}`)
      }
      if (!authObj.refresh_token) {
        throw new Error('Refresh token is missing from auth object')
      }
      refreshToken = authObj.refresh_token
    }
    const tokenEndpoint = `${baseUrl}/hydra/oauth2/token`
    return this.completeAuthentication(refreshToken, baseUrl, tokenEndpoint)
  }
}