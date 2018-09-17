import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'

import {
  DefaultEndPoint,
  DefaultSourceProducerAndSecret,
  DefaultSourceTypeRegistrationBody
} from '../assets/data/defaultConfig'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'

import { Injectable } from '@angular/core'
import { JwtHelper } from 'angular2-jwt'
import { StorageKeys } from '../enums/storage'
import { StorageService } from './storage-service'

@Injectable()
export class AuthService {
  URI_base: string
  URI_managementPortal: string = 'managementportal'
  URI_refresh: string = '/oauth/token'
  URI_subjects: string = '/api/subjects/'

  CONTENTTYPE_urlencode: string = 'application/x-www-form-urlencoded'
  CONTENTTYPE_json: string = 'application/json'
  BODY_refresh: string = 'grant_type=refresh_token&refresh_token='
  BODY_register = DefaultSourceTypeRegistrationBody

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelper
  ) {
    this.updateURI()
  }

  refresh() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const now = new Date().getTime() / 1000
      if (tokens.iat + tokens.expires_in < now) {
        const URI = this.URI_base + this.URI_refresh
        const headers = this.getRegisterHeaders(this.CONTENTTYPE_urlencode)
        const params = this.getRefreshParams(tokens.refresh_token)
        // tslint:disable-next-line:no-shadowed-variable
        const promise = this.createPostRequest(URI, '', {
          headers: headers,
          params: params
          // tslint:disable-next-line:no-shadowed-variable
        }).then(tokens => {
          return this.storage.set(StorageKeys.OAUTH_TOKENS, tokens)
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
      this.URI_base = endPoint + this.URI_managementPortal
    })
  }

  // TODO: test this
  registerToken(registrationToken) {
    const URI = this.URI_base + this.URI_refresh
    // console.debug('URI : ' + URI)
    const refreshBody = this.BODY_refresh + registrationToken
    const headers = this.getRegisterHeaders(this.CONTENTTYPE_urlencode)
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
        this.CONTENTTYPE_json
      )
      const URI = this.URI_base + this.URI_subjects + decoded.sub + '/sources'
      const promise = this.createPostRequest(URI, this.BODY_register, {
        headers: headers
      })
      return promise
    })
  }

  getRefreshTokenFromUrl(URI) {
    return this.http.get(URI).toPromise()
  }

  createPostRequest(uri, body, headers) {
    return this.http.post(uri, body, headers).toPromise()
  }

  getSubjectInformation() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const decoded = this.jwtHelper.decodeToken(tokens.access_token)
      const headers = this.getAccessHeaders(
        tokens.access_token,
        this.CONTENTTYPE_urlencode
      )
      const URI = this.URI_base + this.URI_subjects + decoded.sub
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
}
