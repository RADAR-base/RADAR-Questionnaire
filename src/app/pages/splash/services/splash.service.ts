import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { TokenService } from '../../../core/services/token.service'

@Injectable()
export class SplashService {
  constructor(public storage: StorageService, private token: TokenService) {}

  evalEnrolment() {
    return this.storage
      .get(StorageKeys.PARTICIPANTLOGIN)
      .then(participant =>
        participant
          ? this.token.isRefreshTokenExpired().then(expired => !expired)
          : false
      )
  }
}
