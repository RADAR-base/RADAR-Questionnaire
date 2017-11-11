import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage-service';
import { StorageKeys } from '../enums/storage';
import { JwtHelper } from 'angular2-jwt'
import { DefaultEndPoint } from '../assets/data/defaultConfig'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class AuthService {

  URI_base: string
  URI_managementPortal: string = '/managementportal'
  URI_refresh: string = '/oauth/token'
  URI_subjects: string = '/api/subjects/'

  CONTENTTYPE_urlencode: string = 'application/x-www-form-urlencoded'
  CONTENTTYPE_json: string = 'application/json'
  BODY_refresh: string = 'grant_type=refresh_token&refresh_token='
  BODY_register = {
  "deviceCatalogVersion": "v1",
  "deviceTypeModel": "aRMT App",
  "deviceTypeProducer": "RADAR",
  "deviceTypeId": 1303
  }

  constructor(public http: HttpClient,
    private storage: StorageService,
    private jwtHelper: JwtHelper) {
      this.URI_base = DefaultEndPoint + this.URI_managementPortal
  }

  refresh(refreshToken='') {
      if(refreshToken != '') {
        return this.renewTokens(refreshToken)
      } else {
        return this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
          return this.renewTokens(tokens.refresh_token)
        })
      }

  }

  renewTokens(refreshToken) {
    let URI = this.URI_base + this.URI_refresh
    let refreshBody = this.BODY_refresh + refreshToken

    let promise = new Promise((resolve, reject) => {
      this.http.post(URI, refreshBody, {
        headers: this.getRefreshHeaders(this.CONTENTTYPE_urlencode)
      })
      .toPromise()
      .then(res => {
        this.storage.set(StorageKeys.OAUTH_TOKENS, res)
        resolve()
      })
    })
    return promise
  }

  registerAsSource() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
      let decoded = this.jwtHelper.decodeToken(tokens.access_token)
      let headers = this.getAccessHeaders(tokens.access_token, this.CONTENTTYPE_json)
      let URI = this.URI_base + this.URI_subjects + decoded.sub + '/sources'
      let promise = new Promise((resolve, reject) => {
          this.http.post(URI, this.BODY_register, { headers })
          .toPromise()
          .then(res => {
            resolve()
          })
      })
      return promise
    })
  }

  getSubjectInformation() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
      let decoded = this.jwtHelper.decodeToken(tokens.access_token)
      let headers = this.getAccessHeaders(tokens.access_token, this.CONTENTTYPE_urlencode)
      let URI = this.URI_base + this.URI_subjects + decoded.sub
      return this.http.get(URI, { headers }).toPromise()
    })
  }

  getRefreshHeaders(contentType) {
    var headers = new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa('aRMT:secret'))
      .set('Content-Type', contentType)
    return headers
  }

  getAccessHeaders(accessToken, contentType) {
    var headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + accessToken)
      .set('Content-Type', contentType)
    return headers
  }

}
