import {Injectable} from "@angular/core";
import {AuthService} from "./auth.service";
import {StorageService} from "../../../core/services/storage/storage.service";
import {LogService} from "../../../core/services/misc/log.service";
import {HttpClient} from "@angular/common/http";
import {TokenService} from "../../../core/services/token/token.service";
import {ConfigService} from "../../../core/services/config/config.service";
import {AnalyticsService} from "../../../core/services/usage/analytics.service";
import {
  DefaultEndPoint,
  DefaultKeycloakURL, DefaultProjectName, DefaultRequestEncodedContentType
} from "../../../../assets/data/defaultConfig";
import {InAppBrowser, InAppBrowserOptions} from "@ionic-native/in-app-browser/ngx";
import {StorageKeys} from "../../../shared/enums/storage";
import {KeycloakConfig} from "../../../shared/models/auth";
import {RemoteConfigService} from "../../../core/services/config/remote-config.service";
import {ConfigKeys} from "../../../shared/enums/config";

const uuid = require('uuid/v4')

@Injectable()
export class KeycloakAuthService extends AuthService {

  keycloakConfig: KeycloakConfig
  inAppBrowserOptions: InAppBrowserOptions = {
    zoom: 'no',
    location: 'no',
    clearsessioncache: 'yes',
    clearcache: 'yes'
  }

  constructor(
    public http: HttpClient,
    token: TokenService,
    config: ConfigService,
    logger: LogService,
    analytics: AnalyticsService,
    private storage: StorageService,
    private inAppBrowser: InAppBrowser,
    private remoteConfig: RemoteConfigService,
  ) {
    super(http, token, config, logger, analytics)
    this.updateURI().then(() => {
      this.keycloakConfig = {
        authServerUrl: this.URI_base,
        realm: 'mighealth',
        clientId: 'armt',
        redirectUri: 'http://ucl-mighealth-app/callback/',
      };
      this.logger.log("Initialized keycloak config: ", JSON.stringify(this.keycloakConfig))
      this.getRealmUrl().then((realmUrl) => {
        this.logger.log("Setting realmUrl to config")
        this.keycloakConfig.realmUrl = realmUrl
        return this.token.setTokenURI(realmUrl)
      }).then(() => {
        return this.storage.set(StorageKeys.KEYCLOAK_CONFIG, this.keycloakConfig)
      })
    })
  }

  updateURI() {
    return this.storage.get(StorageKeys.BASE_URI).then(uri => {
      const endPoint = uri ? uri : DefaultEndPoint;
      this.URI_base = endPoint + DefaultKeycloakURL;
    });
  }

  authenticate(authObj) {
    return this.authenticateWithKeycloak(authObj)
    .then(authResponse => {
      return this.registerAuthorizationCode(authResponse)
    })
    .catch((err) => {
      this.logger.error('Auth failed', JSON.stringify(err))
    })
  }

  authenticateWithKeycloak(isRegistration: boolean): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.createAuthenticationUrl(isRegistration)
        .then((authUrl) => {
          const browser = this.inAppBrowser.create(authUrl, '_blank', this.inAppBrowserOptions)
          let authRes = null
          const listener = browser.on('loadstart').subscribe((event: any) => {
            const callback = encodeURI(event.url)
            //Check the redirect uri
            if (callback.indexOf(this.keycloakConfig.redirectUri) > -1) {
              listener.unsubscribe();
              browser.close();
              authRes = this.parseAuthorizationResponse(event.url);
              this.logger.log("Returned auth-code is ", JSON.stringify(authRes))
              resolve(authRes)
            }
          })
        })
    })
  }

  initSubjectInformation() {
    return Promise.all([
      this.storage.get(StorageKeys.BASE_URI),
      this.getSubjectInformation(),
      this.getProjectName()
    ]).then(([baseUrl, subjectInformation, projectName]) => {
      this.logger.log("Project name is :", projectName)
      return this.config.setAll({
        projectId: projectName,
        subjectId: subjectInformation.sub,
        sourceId: uuid(),
        humanReadableId: subjectInformation.username,
        enrolmentDate: new Date(subjectInformation.createdTimestamp).getTime(),
        baseUrl: baseUrl? baseUrl : DefaultEndPoint
      })
    })
  }

  getProjectName() {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.PROJECT_NAME,
          DefaultProjectName
        )
      )
  }

  getSubjectInformation(): Promise<any> {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestEncodedContentType),
      this.getRealmUrl()
    ]).then(([headers, realmUrl]) =>
      this.http.get(this.getSubjectURI(realmUrl), { headers }).toPromise()
    )
  }

  getSubjectURI(realmUrl) {
    return realmUrl + '/protocol/openid-connect/userinfo'
  }

  registerAuthorizationCode(authResponse: any) : Promise<any> {
    return (authResponse.code)
      ? this.token.registerAuthCode(authResponse.code, this.keycloakConfig)
      : new Promise(((resolve, reject) => {
        reject('Authorization Failed: No authorization-code found')
      }))
  }

  createAuthenticationUrl(isRegistration: boolean) {
    const state = uuid();
    const nonce = uuid();
    const responseMode = 'query';
    const responseType = 'code';
    const scope = 'openid';
    return this.getUrlBasedOnAuthAction(isRegistration).then((baseUrl) => {
        return baseUrl +
          '?client_id=' + encodeURIComponent(this.keycloakConfig.clientId) +
          '&state=' + encodeURIComponent(state) +
          '&redirect_uri=' + encodeURIComponent(this.keycloakConfig.redirectUri) +
          '&response_mode=' + encodeURIComponent(responseMode) +
          '&response_type=' + encodeURIComponent(responseType) +
          '&scope=' + encodeURIComponent(scope) +
          '&nonce=' + encodeURIComponent(nonce)
      })
  }

  getUrlBasedOnAuthAction(isRegistration: boolean) {
    return this.getRealmUrl().then((realmUrl) => {
      return isRegistration
          ? realmUrl + '/protocol/openid-connect/registrations'
          : realmUrl + '/protocol/openid-connect/auth'
    })
  }

  getRealmUrl() : Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.keycloakConfig && this.keycloakConfig .authServerUrl) {
        if (this.keycloakConfig.authServerUrl.charAt(this.keycloakConfig.authServerUrl.length - 1) == '/') {
          resolve(this.keycloakConfig.authServerUrl + 'realms/' + encodeURIComponent(this.keycloakConfig.realm));
        } else {
          resolve(this.keycloakConfig.authServerUrl + '/realms/' + encodeURIComponent(this.keycloakConfig.realm));
        }
      } else {
        reject('Keycloak config is not initialized')
      }
    })
  }

  parseAuthorizationResponse(url: any) {
    const hashes = url.slice(url.indexOf('?') + 1).split('&');
    return hashes.reduce((params, hash) => {
      const [key, val] = hash.split('=');
      return Object.assign(params, {[key]: decodeURIComponent(val)})
    }, {});
  }
}
