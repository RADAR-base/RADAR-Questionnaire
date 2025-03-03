import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'
import { Platform } from '@ionic/angular'

import {
  DefaultEndPoint,
  DefaultOAuthClientId,
  DefaultOAuthClientSecret,
  DefaultRequestEncodedContentType,
  DefaultTokenEndPoint,
  DefaultTokenRefreshSeconds
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { StorageKeys } from '../../../shared/enums/storage'
import { OAuthToken } from '../../../shared/models/token'
import { getSeconds } from '../../../shared/utilities/time'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { DefaultManagementPortalURI, DefaultRefreshTokenURI } from 'www/assets/data/defaultConfig'

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_STORE = {
    OAUTH_TOKENS: StorageKeys.OAUTH_TOKENS,
    BASE_URI: StorageKeys.BASE_URI,
    TOKEN_ENDPOINT: StorageKeys.TOKEN_ENDPOINT
  }
  URI_base: string
  private tokenRefreshMillis: number = DefaultTokenRefreshSeconds

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService,
    private remoteConfig: RemoteConfigService,
    private logger: LogService,
    public platform: Platform
  ) {
    this.platform.ready().then(() => {
      this.remoteConfig.subject().subscribe(config => {
        console.log('Updating Token config')
        config
          .getOrDefault(
            ConfigKeys.OAUTH_REFRESH_SECONDS,
            String(DefaultTokenRefreshSeconds)
          )
          .then(
            refreshTime =>
              (this.tokenRefreshMillis = Number(refreshTime) * 1000)
          )
      })
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

  getTokenEndpoint() {
    return this.storage
      .get(this.TOKEN_STORE.TOKEN_ENDPOINT)
      .then(uri => uri ? uri : this.getMPTokenEndpoint())
  }

  getMPTokenEndpoint() {
    return this.getURI().then(baseUrl =>
      `${baseUrl}${DefaultManagementPortalURI}${DefaultRefreshTokenURI}`
    )
  }

  setTokens(tokens) {
    return this.storage.set(this.TOKEN_STORE.OAUTH_TOKENS, tokens)
  }

  setURI(uri: string): Promise<string> {
    let lastSlashIndex = uri.length
    while (lastSlashIndex > 0 && uri[lastSlashIndex - 1] == '/') {
      lastSlashIndex--
    }
    const url = uri.substring(0, lastSlashIndex)
    return this.storage.set(this.TOKEN_STORE.BASE_URI, url).then(() => url)
  }

  setTokenEndpoint(uri: string) {
    return this.storage.set(this.TOKEN_STORE.TOKEN_ENDPOINT, uri)
  }

  static basicCredentials(user: string, password: string): string {
    return 'Basic ' + btoa(`${user}:${password}`)
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
        if (!res.iat)
          res.iat = this.jwtHelper.decodeToken(res.access_token)['iat']
        this.setTokens(res)
        return res
      })
  }

  refresh(): Promise<OAuthToken> {
    return this.getTokens().then(tokens => {
      if (!tokens) {
        throw new Error('No tokens are available to refresh')
      }
      const limit = getSeconds({
        milliseconds: new Date().getTime() + this.tokenRefreshMillis
      })
      if (tokens.iat + tokens.expires_in < limit) {
        const params = this.getRefreshParams(tokens.refresh_token)
        return this.register(params).catch(response => {
          const error = response.error
          if (error && error.error === 'invalid_grant') {
            // Specific check for expired refresh token
            console.error('Refresh token expired. Please log in again.')
            this.reset() // Clear tokens and session data
            throw new Error('Session expired. Please log in again.')
          }

          // Handle other errors (e.g., network, server issues)
          console.error('Error refreshing token:', error)
          throw new Error('Error refreshing token. Please try again.')
        })
      } else {
        return tokens
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

  getRegisterHeaders(contentType): Promise<HttpHeaders> {
    return this.remoteConfig
      .read()
      .then(config =>
        Promise.all([
          config.getOrDefault(ConfigKeys.OAUTH_CLIENT_ID, DefaultOAuthClientId),
          config.getOrDefault(
            ConfigKeys.OAUTH_CLIENT_SECRET,
            DefaultOAuthClientSecret
          )
        ])
      )
      .then(([clientId, clientSecret]) => {
        const creds = TokenService.basicCredentials(clientId, clientSecret)
        return new HttpHeaders()
          .set('Authorization', creds)
          .set('Content-Type', contentType)
      })
  }

  getRefreshParams(refreshToken): HttpParams {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
  }

  isValid(): Promise<boolean> {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      if (!tokens || !tokens.refresh_token) {
        return false // No token available
      }

      const refreshToken = tokens.refresh_token

      // Check if the token is a JWT (simple heuristic: contains three parts separated by dots)
      const isJwt = refreshToken.split('.').length === 3

      if (isJwt) {
        // For JWT tokens, check expiration
        return !this.jwtHelper.isTokenExpired(refreshToken)
      } else {
        // For opaque tokens, assume valid until refreshed
        return true
      }
    })
  }

  reset() {
    return Promise.all([this.setTokens(null)])
  }
}
