import 'rxjs/add/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'

import {
  DefaultEndPoint,
  DefaultManagementPortalURI,
  DefaultRefreshTokenURI,
  DefaultRequestEncodedContentType,
  DefaultSourceProducerAndSecret,
  DefaultTokenRefreshTime
} from '../../../../assets/data/defaultConfig'
import { StorageKeys } from '../../../shared/enums/storage'
import { getSeconds } from '../../../shared/utilities/time'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class TokenService {
  private readonly TOKEN_STORE = {
    OAUTH_TOKENS: StorageKeys.OAUTH_TOKENS,
    BASE_URI: StorageKeys.BASE_URI
  }
  URI_base: string

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService
  ) {}

  getTokens() {
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
    return this.storage.set(this.TOKEN_STORE.BASE_URI, uri)
  }

  register(refreshBody?, params?) {
    return this.getURI().then(uri => {
      const URI = uri + DefaultManagementPortalURI + DefaultRefreshTokenURI
      const headers = this.getRegisterHeaders(DefaultRequestEncodedContentType)
      return this.http
        .post(URI, refreshBody, { headers: headers, params: params })
        .toPromise()
        .then(res => this.setTokens(res))
    })
  }

  refresh(): Promise<any> {
    return this.getTokens().then(tokens => {
      if (tokens) {
        const limit = getSeconds({
          milliseconds: new Date().getTime() - DefaultTokenRefreshTime
        })
        if (tokens.iat + tokens.expires_in < limit) {
          const params = this.getRefreshParams(tokens.refresh_token)
          return this.register('', params)
        } else {
          return tokens
        }
      } else {
        return Promise.reject([])
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

  getRegisterHeaders(contentType) {
    // TODO:: Use empty client secret https://github.com/RADAR-base/RADAR-Questionnaire/issues/140
    return new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(DefaultSourceProducerAndSecret))
      .set('Content-Type', contentType)
  }

  getRefreshParams(refreshToken): HttpParams {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
  }
}
