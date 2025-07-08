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
import { AuthType } from '../../../shared/models/auth'
import { HydraTokenService } from './hydra-token.service'
import { MPTokenService } from './mp-token.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable({
  providedIn: 'root',
})
export class TokenFactoryService extends TokenService {
  private tokenService!: TokenService
  private HYDRA_KEY = 'hydra'
  private isInitialised = false

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
    this.fetchInitialAuthType()
  }

  async fetchInitialAuthType(): Promise<void> {
    try {
      let authType = await this.getAuthType()
      if (!authType) {
        const endpoint = await this.storage.get(StorageKeys.TOKEN_ENDPOINT)
        authType = endpoint && endpoint.includes(this.HYDRA_KEY) ? AuthType.ORY : AuthType.MP
        await this.setAuthType(authType)
      }
      this.updateTokenServiceByType(authType)
      this.isInitialised = true
    } catch (error) {
      this.logger.error('Error initializing TokenFactoryService', error)
      throw new Error('Failed to initialize TokenFactoryService')
    }
  }

  updateTokenServiceByType(authType: AuthType) {
    switch (authType) {
      case AuthType.MP:
        return this.tokenService = this.mpTokenService
      case AuthType.ORY:
        return this.tokenService = this.hydraTokenService
      default:
        return this.tokenService = this.mpTokenService
    }
  }

  async getTokenEndpoint(): Promise<string> {
    return this.tokenService.getTokenEndpoint()
  }

  refresh(): Promise<OAuthToken> {
    return this.tokenService.refresh()
      .catch((error) => this.tokenService.handleError(error))
  }

  forceRefresh(): Promise<OAuthToken> {
    return this.tokenService.forceRefresh()
  }

  async register(refreshBody: any): Promise<OAuthToken> {
    return this.tokenService.register(refreshBody)
  }

  async isValid(): Promise<boolean> {
    return this.fetchInitialAuthType().then(() => this.tokenService.isValid())
  }

  reset() {
    if (this.tokenService)
      return this.tokenService.reset()
    else Promise.resolve()
  }
}
