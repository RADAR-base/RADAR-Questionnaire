import 'rxjs/add/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'

import {
  DefaultEndPoint,
  DefaultManagementPortalURI,
  DefaultRefreshTokenURI,
  DefaultRequestEncodedContentType,
  DefaultSourceProducerAndSecret
} from '../../../assets/data/defaultConfig'
import { StorageKeys } from '../../shared/enums/storage'
import { getSeconds } from '../../shared/utilities/time'
import { StorageService } from './storage.service'

@Injectable()
export class TokenService {
  URI_base: string

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService
  ) {}

  get() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS)
  }

  register(refreshBody?, params?) {
    return this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const URI =
        (uri ? uri : DefaultEndPoint) +
        DefaultManagementPortalURI +
        DefaultRefreshTokenURI
      const headers = this.getRegisterHeaders(DefaultRequestEncodedContentType)
      return this.http
        .post(URI, refreshBody, { headers })
        .toPromise()
        .then(res => this.storage.set(StorageKeys.OAUTH_TOKENS, res))
    })
  }

  refresh(): Promise<any> {
    return this.get().then(tokens => {
      const now = getSeconds({ milliseconds: new Date().getTime() })
      if (tokens.iat + tokens.expires_in < now) {
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
    // TODO:: Use empty client secret https://github.com/RADAR-base/RADAR-Questionnaire/issues/140
    return new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(DefaultSourceProducerAndSecret))
      .set('Content-Type', contentType)
  }

  getRefreshParams(refreshToken) {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
  }
}
