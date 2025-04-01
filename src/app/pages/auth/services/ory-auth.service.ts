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
      const url = new URL(authObj)
      const encodedData = url.searchParams.get('data')
      baseUrl = new URL(url.searchParams.get('referrer')).origin
      if (!encodedData) throw new Error('Ory auth failed')
      refreshToken = JSON.parse(decodeURIComponent(encodedData)).refresh_token
    } else {
      baseUrl = authObj.url
      refreshToken = authObj.refresh_token
    }
    const tokenEndpoint = `${baseUrl}/hydra/oauth2/token`
    return this.completeAuthentication(refreshToken, baseUrl, tokenEndpoint)
  }
}