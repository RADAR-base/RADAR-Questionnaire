import 'rxjs/add/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'

import {
  DefaultEndPoint,
  DefaultManagementPortalURI,
  DefaultOAuthClientId,
  DefaultOAuthClientSecret,
  DefaultRefreshTokenURI,
  DefaultRequestEncodedContentType,
  DefaultTokenRefreshSeconds
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { OAuthToken } from '../../../shared/models/token'
import { getSeconds } from '../../../shared/utilities/time'
import { RemoteConfigService } from '../config/remote-config.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class TokenService {
  private readonly TOKEN_STORE = {
    OAUTH_TOKENS: StorageKeys.OAUTH_TOKENS,
    BASE_URI: StorageKeys.BASE_URI
  }
  URI_base: string
  private tokenRefreshMillis: number = DefaultTokenRefreshSeconds
  private clientCredentials = TokenService.basicCredentials(
    DefaultOAuthClientId,
    DefaultOAuthClientSecret
  )

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService,
    private remoteConfig: RemoteConfigService
  ) {
    remoteConfig.subject().subscribe(config => {
      console.log('Updating Token config')
      config
        .getOrDefault(
          ConfigKeys.OAUTH_REFRESH_SECONDS,
          DefaultTokenRefreshSeconds
        )
        .then(
          refreshTime => (this.tokenRefreshMillis = Number(refreshTime) * 1000)
        )
      Promise.all([
        config.getOrDefault(ConfigKeys.OAUTH_CLIENT_ID, DefaultOAuthClientId),
        config.getOrDefault(
          ConfigKeys.OAUTH_CLIENT_SECRET,
          DefaultOAuthClientSecret
        )
      ]).then(
        ([clientId, clientSecret]) =>
          (this.clientCredentials = TokenService.basicCredentials(
            clientId,
            clientSecret
          ))
      )
    })
  }

  getTokens(): Promise<OAuthToken> {
    return this.storage.get(this.TOKEN_STORE.OAUTH_TOKENS)
  }

  getURI() {
    return this.storage
      .get(this.TOKEN_STORE.BASE_URI)
      .then(uri => (uri ? uri : DefaultEndPoint))
  }

  setTokens(tokens) {
    return this.storage.set(this.TOKEN_STORE.OAUTH_TOKENS, tokens)
  }

  setURI(uri) {
    let lastSlashIndex = uri.length
    while (lastSlashIndex > 0 && uri[lastSlashIndex - 1] == '/') {
      lastSlashIndex--
    }
    return this.storage.set(
      this.TOKEN_STORE.BASE_URI,
      uri.substring(0, lastSlashIndex)
    )
  }

  static basicCredentials(user: string, password: string): string {
    return 'Basic ' + btoa(`${user}:${password}`)
  }

  register(refreshBody) {
    return this.getURI().then(uri => {
      const URI = uri + DefaultManagementPortalURI + DefaultRefreshTokenURI
      const headers = this.getRegisterHeaders(DefaultRequestEncodedContentType)
      console.log(
        `"Registering with ${URI} using client credentials ${this.clientCredentials}`
      )
      return this.http
        .post(URI, refreshBody, { headers: headers })
        .toPromise()
        .then(res => this.setTokens(res))
    })
  }

  refresh(): Promise<any> {
    return this.getTokens().then(tokens => {
      if (tokens) {
        const limit = getSeconds({
          milliseconds: new Date().getTime() + this.tokenRefreshMillis
        })
        if (tokens.iat + tokens.expires_in < limit) {
          const params = this.getRefreshParams(tokens.refresh_token)
          return this.register(params)
        } else {
          return tokens
        }
      } else {
        throw new Error('No tokens are available to refresh')
      }
    })
  }

  getDecodedSubject() {
    return this.getTokens().then(
      tokens => this.jwtHelper.decodeToken(tokens.access_token)['sub']
    )
  }

  getAccessHeaders(contentType) {
    return this.getTokens().then(tokens =>
      new HttpHeaders()
        .set('Authorization', 'Bearer ' + tokens.access_token)
        .set('Content-Type', contentType)
    )
  }

  getRegisterHeaders(contentType): HttpHeaders {
    return new HttpHeaders()
      .set('Authorization', this.clientCredentials)
      .set('Content-Type', contentType)
  }

  getRefreshParams(refreshToken): HttpParams {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
  }

  isValid(): Promise<boolean> {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      return !this.jwtHelper.isTokenExpired(tokens.refresh_token)
    })
  }
}
