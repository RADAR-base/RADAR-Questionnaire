import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage-service';
import { StorageKeys } from '../enums/storage';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

/*
  Generated class for the AuthServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthService {

  URI_base: string = 'https://radar-cns-platform.rosalind.kcl.ac.uk//managementportal'
  URI_refresh: string = '/oauth/token'
  URI_project: string = '/api/projects'

  CONTENTTYPE_urlencode: string = 'application/x-www-form-urlencoded'
  BODY_refresh: string = 'grant_type=refresh_token&refresh_token='

  constructor(public http: HttpClient, private storage: StorageService) {
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
        headers: this.getRefreshHeaders()
      })
      .toPromise()
      .then(res => {
        this.storage.set(StorageKeys.OAUTH_TOKENS, res)
        resolve()
      })
    })
    return promise
  }

  getProjectInformation() {
    let URI = this.URI_base + this.URI_project

    let promise = new Promise((resolve, reject) => {
      return this.getAccessHeaders().then((headers) => {
        this.http.get(URI, { headers })
        .toPromise()
        .then(res => {
          console.log(res)
          resolve()
          // continue here
        })
      })
    })
    return promise
  }

  getRefreshHeaders() {
    var headers = new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa('aRMT:secret'))
      .set('Content-Type', this.CONTENTTYPE_urlencode)
    return headers
  }

  getAccessHeaders() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then((tokens) => {
      var headers = new HttpHeaders()
        .set('Authorization', 'Bearer ' + tokens.access_token)
        .set('Content-Type', this.CONTENTTYPE_urlencode)
      return headers
    })
  }

}
