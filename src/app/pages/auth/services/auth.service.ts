import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'

import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http'
import {Injectable} from '@angular/core'
import {JwtHelperService} from '@auth0/angular-jwt'
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
import {StorageService} from '../../../core/services/storage.service'
import {StorageKeys} from '../../../shared/enums/storage'
import {InAppBrowser, InAppBrowserOptions} from '@ionic-native/in-app-browser';

const uuidv4 = require('uuid/v4');
declare var window: any;

@Injectable()
export class AuthService {
  URI_base: string

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    private jwtHelper: JwtHelperService,
    private inAppBrowser: InAppBrowser
  ) {
    this.updateURI()
  }

  public keycloakLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      const keycloakConfig = {
        authServerUrl: 'https://ucl-mighealth-dev.thehyve.net/auth/',
        realm: 'mighealth',
        clientId: 'armt',
        redirectUri: 'http://ucl-mighealth-app/callback/',
      };

      const url = this.createLoginUrl(keycloakConfig);
      console.log(url);

      const options: InAppBrowserOptions = {
        zoom: 'no',
        location: 'no',
        clearsessioncache: 'yes',
        clearcache: 'yes'
      }
      const browser = this.inAppBrowser.create(url, '_blank', options);

      let listener = browser.on('loadstart').subscribe((event: any) => {

        //Check the redirect uri
        if (event.url.indexOf(keycloakConfig.redirectUri) > -1) {
          listener.unsubscribe();
          browser.close();
          const code = this.parseUrlParamsToObject(event.url);
          this.getAccessToken(keycloakConfig, code);
          resolve(event.url);
        } else {
          reject("Could not authenticate");
        }

      });

    });
  }

  parseUrlParamsToObject(url: any) {
    let hashes = url.slice(url.indexOf('?') + 1).split('&');
    return hashes.reduce((params, hash) => {
      let [key, val] = hash.split('=');
      return Object.assign(params, {[key]: decodeURIComponent(val)})
    }, {});
  }

  createLoginUrl(keycloakConfig: any) {
    const state = uuidv4();
    const nonce = uuidv4();
    const responseMode = 'query';
    const responseType = 'code';
    const scope = 'openid';
    return this.getRealmUrl(keycloakConfig) + '/protocol/openid-connect/auth' +
      '?client_id=' + encodeURIComponent(keycloakConfig.clientId) +
      '&state=' + encodeURIComponent(state) +
      '&redirect_uri=' + encodeURIComponent(keycloakConfig.redirectUri) +
      '&response_mode=' + encodeURIComponent(responseMode) +
      '&response_type=' + encodeURIComponent(responseType) +
      '&scope=' + encodeURIComponent(scope) +
      '&nonce=' + encodeURIComponent(nonce);
  }

  getRealmUrl(kc: any) {
    if (kc && kc.authServerUrl) {
      if (kc.authServerUrl.charAt(kc.authServerUrl.length - 1) == '/') {
        return kc.authServerUrl + 'realms/' + encodeURIComponent(kc.realm);
      } else {
        return kc.authServerUrl + '/realms/' + encodeURIComponent(kc.realm);
      }
    } else {
      return undefined;
    }
  }

  getAccessToken(kc: any, authorizationResponse: any) {
    alert('here');
    const URI = this.getRealmUrl(kc) + '/protocol/openid-connect/token';
    const body = this.getAccessTokenParams(authorizationResponse.code, kc.clientId, kc.redirectUri);

    const headers = new HttpHeaders()
      .set('Authorization', 'Basic ' + btoa(DefaultSourceProducerAndSecret))
      .set('Content-Type', 'application/x-www-form-urlencoded');

    const clientSecret = (kc.credentials || {}).secret;
    if (kc.clientId && clientSecret) {
      headers.set('Authorization', 'Basic ' + btoa(kc.clientId + ':' + clientSecret));
    }
    const promise = this.createPostRequest(URI,  body, {
      header: headers,
    }).then(newTokens => {

        alert(JSON.stringify(newTokens));
    }, (error) => {
      alert(JSON.stringify(error))
    });
    return promise;
  }
  refresh() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const now = new Date().getTime() / 1000
      if (tokens.iat + tokens.expires_in < now) {
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
        });
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

  getAccessTokenParams(code , clientId, redirectUrl) {
    return new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('client_id', encodeURIComponent(clientId))
      .set('redirect_uri', redirectUrl);
  }
}
