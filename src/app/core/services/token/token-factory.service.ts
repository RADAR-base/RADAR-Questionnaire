import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { JwtHelperService } from '@auth0/angular-jwt'
import { Platform } from '@ionic/angular'

import { DefaultAuthType } from '../../../../assets/data/defaultConfig'
import { OAuthToken } from '../../../shared/models/token'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from '../misc/log.service'
import { StorageService } from '../storage/storage.service'
import { TokenService } from './token.service'
import { AuthType } from 'src/app/shared/models/auth'
import { HydraTokenService } from './hydra-token.service'
import { MPTokenService } from './mp-token.service'
import { StorageKeys } from 'src/app/shared/enums/storage'

@Injectable({
  providedIn: 'root'
})
export class TokenFactoryService extends TokenService {
  tokenService: TokenService

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    public jwtHelper: JwtHelperService,
    public remoteConfig: RemoteConfigService,
    public logger: LogService,
    public platform: Platform,
    public hydraTokenService: HydraTokenService,
    public mpTokenService: MPTokenService,
  ) {
    super(http, storage, jwtHelper, remoteConfig, logger, platform)
    this.init()
  }

  init() {
    return this.storage
      .get(StorageKeys.PLATFORM_AUTH_TYPE)
      .then(type => {
        const authType = type ? type : DefaultAuthType
        switch (authType) {
          case AuthType.MP: {
            return (this.tokenService = this.mpTokenService)
          }
          case AuthType.ORY:
            return (this.tokenService = this.hydraTokenService)
          default:
            throw new Error('No such token service available')
        }
      })
  }

  getTokenEndpoint(): Promise<string> {
    return this.tokenService.getTokenEndpoint()
  }

  register(refreshBody: any): Promise<OAuthToken> {
    return this.tokenService.register(refreshBody)
  }

  isValid(): Promise<boolean> {
    return this.tokenService.isValid()
  }
}
