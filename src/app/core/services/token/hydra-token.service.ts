import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'
import { Platform } from '@ionic/angular'

import { DefaultRequestEncodedContentType, DefaultTokenEndPoint } from '../../../../assets/data/defaultConfig'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from './token.service'
import { OAuthToken } from '../../../shared/models/token'
import { AuthType } from 'src/app/shared/models/auth'
import { ConfigKeys } from 'src/app/shared/enums/config'

@Injectable({
  providedIn: 'root'
})
export class HydraTokenService extends TokenService {

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    public jwtHelper: JwtHelperService,
    public remoteConfig: RemoteConfigService,
    public logger: LogService,
    public platform: Platform
  ) {
    super(http, storage, jwtHelper, remoteConfig, logger, platform)
  }

  getTokenEndpoint() {
    return this.storage
      .get(this.TOKEN_STORE.TOKEN_ENDPOINT)
      .then(uri => uri ? uri : this.getURI().then(baseUrl =>
        `${baseUrl}/hydra/oauth2/token`
      ))
  }

  isValid(): Promise<boolean> {
    return this.getTokens().then(tokens => {
      if (!tokens || !tokens.refresh_token) {
        return false // No token available
      }
      // For opaque tokens, assume valid until refreshed
      return true
    })
  }

  register(refreshBody): Promise<OAuthToken> {
    return Promise.all([
      this.getTokenEndpoint(),
      this.getRegisterHeaders(DefaultRequestEncodedContentType)
    ])
      .then(([uri, headers]) => {
        this.logger.log(`"Registering with ${uri} and headers`, headers)
        return this.http
          .post(uri, refreshBody, { headers: headers })
          .toPromise()
      })
      .then((res: any) => {
        res.iat = this.jwtHelper.decodeToken(res.access_token)['iat']
        this.setTokens(res)
        return res
      })
  }

  handleError(error): any {
    if (error && error.error === 'invalid_grant') {
      // Specific check for expired refresh token
      console.error('Refresh token expired. Please log in again.')
      return this.getTokenFromRemoteStorage().then(token => {
        if (token) {
          return this.register(this.getRefreshParams(token))
        } else {
          throw new Error('Session expired. Please log in again.')
        }
      })
    }
    // Handle other errors (e.g., network, server issues)
    console.error('Error refreshing token:', error)
    throw new Error('Error refreshing token. Please try again.')
  }

  updateTokenServiceByType(authType: AuthType) { }

  getTokenFromRemoteStorage() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.get(
          ConfigKeys.TOKEN_BACKUP
        )
      ).then((token) => {
        if (!token) throw new Error('No token available')
        return token
      })
  }

}
