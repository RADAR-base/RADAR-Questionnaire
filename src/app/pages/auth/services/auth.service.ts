import 'rxjs/add/operator/toPromise'

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Firebase } from "@ionic-native/firebase/ngx";
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';

import {
  setDateTimeToMidnight
} from '../../../shared/utilities/time'
import {
  DefaultEndPoint,
  DefaultKeycloakURL,
  DefaultManagementPortalURI,
  DefaultRefreshTokenRequestBody,
  DefaultRequestEncodedContentType,
  DefaultRequestJSONContentType,
  DefaultSourceTypeModel,
  DefaultSourceTypeRegistrationBody,
  DefaultSubjectsURI
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { TokenService } from '../../../core/services/token/token.service'
import { MetaToken } from '../../../shared/models/token'
import { isValidURL } from '../../../shared/utilities/form-validators'
import {StorageKeys} from "../../../shared/enums/storage";
import {StorageService} from "../../../core/services/storage/storage.service";
import {SubjectConfigService} from "../../../core/services/config/subject-config.service";

const uuidv4 = require('uuid/v4');

declare var window: any;

@Injectable()
export class AuthService {
  URI_base: string;
  keycloakConfig: any;

  constructor(
    public http: HttpClient,
    private token: TokenService,
    private config: ConfigService,
    private logger: LogService,
    private analytics: AnalyticsService,
    private inAppBrowser: InAppBrowser,
    private fireBase: Firebase,
    private storage: StorageService,
    private subjectConfigService: SubjectConfigService
  ) {
    // UCL start
    this.updateURI().then(() => {
      this.keycloakConfig = {
        authServerUrl: this.URI_base,
        realm: 'mighealth',
        clientId: 'armt',
        redirectUri: 'http://ucl-mighealth-app/callback/',
      };
    });
  }

  public keycloakLogin(login: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = this.createLoginUrl(this.keycloakConfig, login);
      console.log(url);

      const options: InAppBrowserOptions = {
        zoom: 'no',
        location: 'no',
        clearsessioncache: 'yes',
        clearcache: 'yes'
      }
      const browser = this.inAppBrowser.create(url, '_blank', options);

      const listener = browser.on('loadstart').subscribe((event: any) => {
        const callback = encodeURI(event.url);
        //Check the redirect uri
        if (callback.indexOf(this.keycloakConfig.redirectUri) > -1) {
          listener.unsubscribe();
          browser.close();
          const code = this.parseUrlParamsToObject(event.url);
          this.getAccessToken(this.keycloakConfig, code).then(
            () => {
              const token = this.storage.get(StorageKeys.OAUTH_TOKENS);
              resolve(token);
            },
            () => reject("Count not login in to keycloak")
          );
        }
      });

    });
  }

  getAccessToken(kc: any, authorizationResponse: any) {
    const URI = this.getTokenUrl();
    const body = this.getAccessTokenParams(authorizationResponse.code, kc.clientId, kc.redirectUri);
    const headers = this.getTokenRequestHeaders();

    return this.createPostRequest(URI,  body, {
      header: headers,
    }).then((newTokens: any) => {
      newTokens.iat = (new Date().getTime() / 1000) - 10; // reduce 10 sec to for delay
      this.storage.set(StorageKeys.OAUTH_TOKENS, newTokens);
    });
  }

  parseUrlParamsToObject(url: any) {
    const hashes = url.slice(url.indexOf('?') + 1).split('&');
    return hashes.reduce((params, hash) => {
      const [key, val] = hash.split('=');
      return Object.assign(params, {[key]: decodeURIComponent(val)})
    }, {});
  }

  createLoginUrl(keycloakConfig: any, isLogin: boolean) {
    const state = uuidv4();
    const nonce = uuidv4();
    const responseMode = 'query';
    const responseType = 'code';
    const scope = 'openid';
    return this.getUrlForAction(keycloakConfig, isLogin) +
      '?client_id=' + encodeURIComponent(keycloakConfig.clientId) +
      '&state=' + encodeURIComponent(state) +
      '&redirect_uri=' + encodeURIComponent(keycloakConfig.redirectUri) +
      '&response_mode=' + encodeURIComponent(responseMode) +
      '&response_type=' + encodeURIComponent(responseType) +
      '&scope=' + encodeURIComponent(scope) +
      '&nonce=' + encodeURIComponent(nonce);
  }

  getUrlForAction(keycloakConfig: any, isLogin: boolean) {
    return isLogin ? this.getRealmUrl(keycloakConfig) + '/protocol/openid-connect/auth'
      : this.getRealmUrl(keycloakConfig) + '/protocol/openid-connect/registrations';
  }

  retrieveUserInformation(language) {
    return new Promise((resolve, reject) => {
      this.loadUserInfo().then(res => {
        const subjectInformation: any = res
        const participantId = subjectInformation.sub
        const participantLogin = subjectInformation.username
        const createdDate = new Date(subjectInformation.createdTimestamp);
        const createdDateMidnight = setDateTimeToMidnight(
          createdDate
        );
        this.fetchProjectId().then((result) => {
          const projectName = result;
          resolve (
            // this.storage.init(
            //   participantId,
            //   participantLogin,
            //   projectName,
            //   language,
            //   createdDate,
            //   createdDateMidnight
            // )
            // FIXME here it should be config.setAll(User)
            "STAGING_PROJECT"
          );
        })
      }).catch(reject);
    });

  }

  fetchProjectId() {
    return new Promise((resolve, reject) => {
      window.FirebasePlugin.fetch(600, function () {
        window.FirebasePlugin.activateFetched(function (activated) {
          window.FirebasePlugin.getValue('projectId', function (value) {
            resolve(value);
          }, function (error) {
            console.log("FirebasePlugin.getValue error " + error);
            reject(error);
          });
        }, function (error) {
          console.error(error);
          reject(error);
        });
      });
    })
  }

  loadUserInfo() {
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then( tokens => {
      const url = this.getRealmUrl(this.keycloakConfig) + '/protocol/openid-connect/userinfo';
      const headers = this.getAccessHeaders(tokens.access_token, DefaultRequestJSONContentType);
      return this.http.get(url, {headers: headers}).toPromise();
    })
  }

  authenticate(authObj) {
    return (isValidURL(authObj)
      ? this.metaTokenUrlAuth(authObj)
      : this.metaTokenJsonAuth(authObj)
    ).then(refreshToken => {
      return this.registerToken(refreshToken)
        .then(() => this.registerAsSource())
        .then(() => this.registerToken(refreshToken))
    })
  }

  metaTokenUrlAuth(authObj) {
    // NOTE: Meta QR code and new QR code
    return this.getRefreshTokenFromUrl(authObj).then((body: any) => {
      this.logger.log(`Retrieved refresh token from ${body.baseUrl}`, body)
      const refreshToken = body.refreshToken
      return this.token
        .setURI(body.baseUrl)
        .then(baseUrl => this.analytics.setUserProperties({ baseUrl }))
        .catch()
        .then(() => this.updateURI())
        .then(() => refreshToken)
    })
  }

  metaTokenJsonAuth(authObj) {
    // NOTE: Old QR codes: containing refresh token as JSON
    return this.updateURI()
      .then(() => JSON.parse(authObj).refreshToken)
  }

  createPostRequest(uri, body, headers) {
    return this.http.post(uri, body, headers).toPromise()
  }

  updateURI() {
    // return this.token.getURI().then(uri => {
    //   this.URI_base = uri + DefaultManagementPortalURI
    // })
    return this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const endPoint = uri ? uri : DefaultEndPoint;
      this.URI_base = endPoint + DefaultKeycloakURL;
    });
  }

  registerToken(registrationToken): Promise<void> {
    const refreshBody = DefaultRefreshTokenRequestBody + registrationToken
    return this.token.register(refreshBody)
  }

  getRefreshTokenFromUrl(url): Promise<MetaToken> {
    return this.http.get(url).toPromise()
  }

  getSubjectURI(subject) {
    return this.URI_base + DefaultSubjectsURI + subject
  }

  getSubjectInformation(): Promise<any> {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestEncodedContentType),
      this.token.getDecodedSubject(),
    ]).then(([headers, subject]) =>
      this.http.get(this.getSubjectURI(subject), { headers }).toPromise()
    )
  }

  getAccessHeaders(accessToken, contentType) {
    return new HttpHeaders()
      .set('Authorization', 'Bearer ' + accessToken)
      .set('Content-Type', contentType);
  }

  getRefreshParams(refreshToken, clientId) {
    return new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
      .set('client_id', encodeURIComponent(clientId))
  }

  initSubjectInformation() {
    return Promise.all([
      this.token.getURI(),
      this.getSubjectInformation()
    ]).then(([baseUrl, subjectInformation]) => {
      return this.config.setAll({
        projectId: subjectInformation.project.projectName,
        subjectId: subjectInformation.login,
        sourceId: this.getSourceId(subjectInformation),
        humanReadableId: subjectInformation.externalId,
        enrolmentDate: new Date(subjectInformation.createdDate).getTime(),
        baseUrl: baseUrl,
      })
    })
  }

  getSourceId(response) {
    const source = response.sources.find(s => s.sourceTypeModel === DefaultSourceTypeModel)
    return source !== undefined ? source.sourceId : 'Device not available'
  }

  registerAsSource() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestJSONContentType),
      this.token.getDecodedSubject()
    ]).then(([headers, subject]) =>
      this.http
        .post(
          this.getSubjectURI(subject) + '/sources',
          DefaultSourceTypeRegistrationBody,
          {
            headers
          }
        )
        .toPromise()
    )
  }

  getAccessTokenParams(code , clientId, redirectUrl) {
    return new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('client_id', encodeURIComponent(clientId))
      .set('redirect_uri', redirectUrl);
  }

  getTokenUrl() {
    return this.getRealmUrl(this.keycloakConfig) + '/protocol/openid-connect/token';
  }

  getTokenRequestHeaders() {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded');

    const clientSecret = (this.keycloakConfig.credentials || {}).secret;
    if (this.keycloakConfig.clientId && clientSecret) {
      headers.set('Authorization', 'Basic ' + btoa(this.keycloakConfig.clientId + ':' + clientSecret));
    }
    return headers;
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
}
