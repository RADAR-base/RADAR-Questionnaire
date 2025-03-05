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
  providedIn: 'root',
})
export class TokenFactoryService extends TokenService {
  private tokenService!: TokenService

  constructor(
    public http: HttpClient,
    public storage: StorageService,
    public jwtHelper: JwtHelperService,
    public remoteConfig: RemoteConfigService,
    public logger: LogService,
    public platform: Platform,
    private hydraTokenService: HydraTokenService,
    private mpTokenService: MPTokenService
  ) {
    super(http, storage, jwtHelper, remoteConfig, logger, platform)
    this.init()
  }

  private async init(): Promise<void> {
    try {
      let authType = await this.storage.get(StorageKeys.PLATFORM_AUTH_TYPE)

      if (!authType) {
        const endpoint = await this.storage.get(StorageKeys.TOKEN_ENDPOINT)
        authType = endpoint ? AuthType.ORY : AuthType.MP
        await this.storage.set(StorageKeys.PLATFORM_AUTH_TYPE, authType)
      }

      this.tokenService = this.getTokenServiceByType(authType)
    } catch (error) {
      this.logger.error('Error initializing TokenFactoryService', error)
      throw new Error('Failed to initialize TokenFactoryService')
    }
  }

  private getTokenServiceByType(authType: AuthType): TokenService {
    switch (authType) {
      case AuthType.MP:
        return this.mpTokenService
      case AuthType.ORY:
        return this.hydraTokenService
      default:
        return this.mpTokenService
    }
  }

  async getTokenEndpoint(): Promise<string> {
    return this.tokenService.getTokenEndpoint()
  }

  async register(refreshBody: any): Promise<OAuthToken> {
    return this.tokenService.register(refreshBody)
  }

  async isValid(): Promise<boolean> {
    return this.tokenService.isValid()
  }
}
