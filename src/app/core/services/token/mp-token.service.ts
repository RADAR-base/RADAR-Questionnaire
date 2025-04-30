import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'
import { Platform } from '@ionic/angular'

import {
  DefaultRequestEncodedContentType,
  DefaultManagementPortalURI,
  DefaultRefreshTokenURI
} from '../../../../assets/data/defaultConfig'
import { OAuthToken } from '../../../shared/models/token'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from './token.service'

@Injectable({
  providedIn: 'root'
})
export class MPTokenService extends TokenService {

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    public jwtHelper: JwtHelperService,
    public remoteConfig: RemoteConfigService,
    public logger: LogService,
    public platform: Platform
  ) {
    super(http, storage, jwtHelper, remoteConfig, logger, platform)
  }

  getTokenEndpoint() {
    return this.getURI().then(baseUrl =>
      `${baseUrl}${DefaultManagementPortalURI}${DefaultRefreshTokenURI}`
    )
  }

  isValid(): Promise<boolean> {
    return this.getTokens()
      .then(tokens => !this.jwtHelper.isTokenExpired(tokens.refresh_token))
  }

  register(refreshBody): Promise<OAuthToken> {
    return Promise.all([
      this.getTokenEndpoint(),
      this.getRegisterHeaders(DefaultRequestEncodedContentType)
    ])
      .then(([uri, headers]) => {
        this.logger.log(`"Registering with ${uri} and headers`, headers)
        return this.http
          .post(uri, refreshBody, { headers: headers })
          .toPromise()
      })
      .then((res: any) => {
        this.setTokens(res)
        return res
      })
  }

  forceRefresh(): Promise<any> {
    return this.refresh()
  }

}
