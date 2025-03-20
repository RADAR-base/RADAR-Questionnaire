import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultManagementPortalURI,
  DefaultSourceTypeModel,
  DefaultRefreshTokenURI,
  DefaultMetaTokenURI,
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { SubjectConfigService } from '../../../core/services/config/subject-config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { TokenService } from '../../../core/services/token/token.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { MetaToken, OAuthToken } from '../../../shared/models/token'
import { AuthType } from '../../../shared/models/auth'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root',
})
export class MpAuthService extends AuthService {
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

  authenticate(authObj: string): Promise<any> {
    this.token.setAuthType(AuthType.MP)
    return this.getRefreshTokenFromUrl(authObj)
      .then(body => {
        const { refreshToken, baseUrl } = body
        this.logger.log(`Retrieved refresh token from ${baseUrl}`, body)
        const tokenEndpoint = `${baseUrl}${DefaultManagementPortalURI}${DefaultRefreshTokenURI}`
        return this.completeAuthentication(refreshToken, baseUrl, tokenEndpoint)
      })
      .catch(err => {
        this.logger.error('Failed to retrieve refresh token', err)
        throw err
      })
  }

  private getRefreshTokenFromUrl(url: string): Promise<MetaToken> {
    return this.http.get<MetaToken>(url).toPromise()
  }
}