import {Injectable} from "@angular/core";
import {TokenService} from "./token.service";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {StorageService} from "../storage/storage.service";
import {JwtHelperService} from "@auth0/angular-jwt";
import {RemoteConfigService} from "../config/remote-config.service";
import {LogService} from "../misc/log.service";
import {StorageKeys} from "../../../shared/enums/storage";
import {KeycloakConfig} from "../../../shared/models/auth";
import {ConfigKeys} from "../../../shared/enums/config";
import {
  DefaultRequestEncodedContentType
} from "../../../../assets/data/defaultConfig";


@Injectable()
export class KeycloakTokenService extends TokenService {

  private readonly KEYCLOAK_TOKEN_STORE = {
    TOKEN_URI: StorageKeys.TOKEN_URI
  }

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    protected jwtHelper: JwtHelperService,
    protected remoteConfig: RemoteConfigService,
    protected logger: LogService
  ) {
    super(http, storage, jwtHelper, remoteConfig, logger)
  }

  registerAuthCode(authorizationCode: any, keycloakConfig: KeycloakConfig) {
    this.logger.log("authorizing code", authorizationCode)
    // get access token and setToken
    return Promise.all([
      this.getTokenURL(keycloakConfig.realmUrl),
      this.getTokenHeaders(DefaultRequestEncodedContentType, keycloakConfig),
      this.getTokenParams(authorizationCode, keycloakConfig.clientId, keycloakConfig.redirectUri)
    ])
      .then(([uri, headers, body]) => {
        this.logger.log(`"Requesting access token with code: ${authorizationCode}, URI: ${uri} and headers`, headers)
        return this.http
          .post(uri, body, { headers: headers })
          .toPromise()
      })
      .then((res: any) => {
        res.iat = (new Date().getTime() / 1000) - 10; // reduce 10 sec to for delay
        this.setTokens(res)
      })
  }

  getTokenParams(code , clientId, redirectUrl) {
    return new Promise(resolve => {
      resolve(
        new HttpParams()
          .set('grant_type', 'authorization_code')
          .set('code', code)
          .set('client_id', encodeURIComponent(clientId))
          .set('redirect_uri', redirectUrl)
      )
    })
  }

  getTokenHeaders(contentType, keycloakConfig: KeycloakConfig): Promise<HttpHeaders> {
    return this.remoteConfig.read()
      .then(config => Promise.all([
        config.getOrDefault(ConfigKeys.OAUTH_CLIENT_ID, keycloakConfig.clientId),
        config.getOrDefault(
          ConfigKeys.OAUTH_CLIENT_SECRET, '' //(keycloakConfig.credentials || {}).secret
        )
      ]))
      .then(([clientId, clientSecret]) => {
        const creds = TokenService.basicCredentials(
          clientId,
          clientSecret
        )
        return new HttpHeaders()
          .set('Authorization', creds)
          .set('Content-Type', contentType)
      })
  }

  getTokenURL(realmUrl) {
    const valueFromStore = this.storage
      .get(this.KEYCLOAK_TOKEN_STORE.TOKEN_URI)
    return valueFromStore != null ? valueFromStore :  realmUrl + '/protocol/openid-connect/token'
  }

  setTokenURI(uri: string): Promise<string> {
    let lastSlashIndex = uri.length
    while (lastSlashIndex > 0 && uri[lastSlashIndex - 1] == '/') {
      lastSlashIndex--
    }
    return this.storage.set(
      this.KEYCLOAK_TOKEN_STORE.TOKEN_URI,
      uri.substring(0, lastSlashIndex) + '/protocol/openid-connect/token'
    )
  }

}
