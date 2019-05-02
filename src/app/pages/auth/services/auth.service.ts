import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'

import {
  DefaultEndPoint,
  DefaultManagementPortalURI,
  DefaultMetaTokenURI,
  DefaultRefreshTokenRequestBody,
  DefaultRefreshTokenURI,
  DefaultRequestEncodedContentType,
  DefaultRequestJSONContentType,
  DefaultSourceProducerAndSecret,
  DefaultSourceTypeRegistrationBody,
  DefaultSubjectsURI,
  DefaultTokenRefreshTime
} from '../../../../assets/data/defaultConfig'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { getSeconds } from '../../../shared/utilities/time'

@Injectable()
export class AuthService {
  URI_base: string

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService
  ) {
    this.updateURI()
  }

  refresh() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const limit = getSeconds({
        milliseconds: new Date().getTime() - DefaultTokenRefreshTime
      })
      if (tokens.iat + tokens.expires_in < limit) {
        const URI = this.URI_base + DefaultRefreshTokenURI
        const headers = this.getRegisterHeaders(
          DefaultRequestEncodedContentType
        )
        const params = this.getRefreshParams(tokens.refresh_token)
        const promise = this.createPostRequest(URI, '', {
          headers: headers,
          params: params
        }).then(newTokens => {
          return this.storage.set(StorageKeys.OAUTH_TOKENS, newTokens)
        })
        return promise
      } else {
        return Promise.resolve(tokens)
      }
    })
  }

  updateURI() {
    return this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const endPoint = uri ? uri : DefaultEndPoint
      this.URI_base = endPoint + DefaultManagementPortalURI
    })
  }

  // TODO: test this
  registerToken(registrationToken) {
    const URI = this.URI_base + DefaultRefreshTokenURI
    // console.debug('URI : ' + URI)
    const refreshBody = DefaultRefreshTokenRequestBody + registrationToken
    const headers = this.getRegisterHeaders(DefaultRequestEncodedContentType)
    const promise = this.createPostRequest(URI, refreshBody, {
      headers: headers
    })
    return promise.then(res => {
      return this.storage.set(StorageKeys.OAUTH_TOKENS, res)
    })
  }

  registerAsSource() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const decoded = this.jwtHelper.decodeToken(tokens.access_token)
      const headers = this.getAccessHeaders(
        tokens.access_token,
        DefaultRequestJSONContentType
      )
      const URI = this.URI_base + DefaultSubjectsURI + decoded.sub + '/sources'
      const promise = this.createPostRequest(
        URI,
        DefaultSourceTypeRegistrationBody,
        {
          headers: headers
        }
      )
      return promise
    })
  }

  getRefreshTokenFromUrl(url) {
    return this.http.get(url).toPromise()
  }

  getURLFromToken(base, token) {
    return base + DefaultMetaTokenURI + token
  }

  createPostRequest(uri, body, headers) {
    return this.http.post(uri, body, headers).toPromise()
  }

  getSubjectInformation() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const decoded = this.jwtHelper.decodeToken(tokens.access_token)
      const headers = this.getAccessHeaders(
        tokens.access_token,
        DefaultRequestEncodedContentType
      )
      const URI = this.URI_base + DefaultSubjectsURI + decoded.sub
      return this.http.get(URI, { headers }).toPromise()
    })
  }

  getRegisterHeaders(contentType) {
    // TODO:: Use empty client secret https://github.com/RADAR-base/RADAR-Questionnaire/issues/140
    const headers = new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(DefaultSourceProducerAndSecret))
      .set('Content-Type', contentType)
    return headers
  }

  getAccessHeaders(accessToken, contentType) {
    const headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + accessToken)
      .set('Content-Type', contentType)
    return headers
  }

  getRefreshParams(refreshToken) {
    const params = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
    return params
  }

  isRefreshTokenExpired() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      return this.jwtHelper.isTokenExpired(tokens.refresh_token)
    })
  }
}
