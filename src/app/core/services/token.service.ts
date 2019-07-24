import 'rxjs/add/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Inject, Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'

import {
  DefaultEndPoint,
  DefaultManagementPortalURI,
  DefaultOAuthClientId,
  DefaultOAuthClientSecret,
  DefaultRefreshTokenURI,
  DefaultRequestEncodedContentType,
  DefaultTokenRefreshSeconds,
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { getSeconds } from '../../shared/utilities/time'
import { StorageService } from './storage.service'
import {
  REMOTE_CONFIG_SERVICE,
  RemoteConfigService,
} from './remote-config.service'
import { ConfigKeys } from '../../shared/enums/config'

@Injectable()
export class TokenService {
  URI_base: string
  private tokenRefreshMillis: number = DefaultTokenRefreshSeconds
  private clientCredentials = TokenService.basicCredentials(DefaultOAuthClientId, DefaultOAuthClientSecret)

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService,
    @Inject(REMOTE_CONFIG_SERVICE) private remoteConfig: RemoteConfigService,
  ) {
    remoteConfig.subject()
      .subscribe(config => {
        config.getOrDefault(ConfigKeys.OAUTH_REFRESH_SECONDS, DefaultTokenRefreshSeconds)
          .then(refreshTime => this.tokenRefreshMillis = Number(refreshTime) * 1000)

        Promise.all([
            config.getOrDefault(ConfigKeys.OAUTH_CLIENT_ID, DefaultOAuthClientId),
            config.getOrDefault(ConfigKeys.OAUTH_CLIENT_SECRET, DefaultOAuthClientSecret)
          ])
          .then(([clientId, clientSecret]) =>
            this.clientCredentials = TokenService.basicCredentials(clientId, clientSecret)
          )
      })
  }

  get() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS)
  }

  static basicCredentials(user: string, password: string): string {
    return "Basic " + btoa(`${user}:${password}`)
  }

  register(refreshBody?, params?) {
    return this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const URI =
        (uri ? uri : DefaultEndPoint) +
        DefaultManagementPortalURI +
        DefaultRefreshTokenURI
      const headers = this.getRegisterHeaders(DefaultRequestEncodedContentType)
      return this.http
        .post(URI, refreshBody, { headers: headers, params: params })
        .toPromise()
        .then(res => this.storage.set(StorageKeys.OAUTH_TOKENS, res))
    })
  }

  refresh(): Promise<any> {
    return this.get().then(tokens => {
      const limit = getSeconds({
        milliseconds: new Date().getTime() + this.tokenRefreshMillis
      })
      if (tokens.iat + tokens.expires_in < limit) {
        const params = this.getRefreshParams(tokens.refresh_token)
        return this.register('', params)
      } else {
        return tokens
      }
    })
  }

  getDecodedSubject() {
    return this.get().then(
      tokens => this.jwtHelper.decodeToken(tokens.access_token)['sub']
    )
  }

  getAccessHeaders(contentType) {
    return this.get().then(tokens =>
      new HttpHeaders()
        .set('Authorization', 'Bearer ' + tokens.access_token)
        .set('Content-Type', contentType)
    )
  }

  getRegisterHeaders(contentType) {
    return new HttpHeaders()
      .set('Authorization', this.clientCredentials)
      .set('Content-Type', contentType)
  }

  getRefreshParams(refreshToken): HttpParams {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
  }

  isRefreshTokenExpired() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      return this.jwtHelper.isTokenExpired(tokens.refresh_token)
    })
  }
}
