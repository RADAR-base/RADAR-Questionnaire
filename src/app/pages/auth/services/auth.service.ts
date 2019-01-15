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
  DefaultSubjectsURI
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

  refresh(): Promise<any> {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const now = getSeconds({ milliseconds: new Date().getTime() })
      if (tokens.iat + tokens.expires_in < now) {
        const URI = this.URI_base + DefaultRefreshTokenURI
        const headers = this.getRegisterHeaders(
          DefaultRequestEncodedContentType
        )
        const params = this.getRefreshParams(tokens.refresh_token)
        return this.createPostRequest(URI, '', { headers, params }).then(
          newTokens => this.storage.set(StorageKeys.OAUTH_TOKENS, newTokens)
        )
      } else {
        return tokens
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
    return this.createPostRequest(URI, refreshBody, { headers }).then(res =>
      this.storage.set(StorageKeys.OAUTH_TOKENS, res)
    )
  }

  registerAsSource() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const decoded = this.jwtHelper.decodeToken(tokens.access_token)
      const headers = this.getAccessHeaders(
        tokens.access_token,
        DefaultRequestJSONContentType
      )
      const URI = this.URI_base + DefaultSubjectsURI + decoded.sub + '/sources'
      return this.createPostRequest(URI, DefaultSourceTypeRegistrationBody, {
        headers
      })
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
    return new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(DefaultSourceProducerAndSecret))
      .set('Content-Type', contentType)
  }

  getAccessHeaders(accessToken, contentType) {
    return new HttpHeaders()
      .set('Authorization', 'Bearer ' + accessToken)
      .set('Content-Type', contentType)
  }

  getRefreshParams(refreshToken) {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
  }
}
