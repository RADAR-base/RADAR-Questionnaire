import { Injectable } from '@angular/core'

import { ConfigService } from '../../../core/services/config/config.service'

@Injectable()
export class SplashService {
  constructor(private config: ConfigService) {}

  evalEnrolment() {
    return this.config.checkParticipantEnrolled()
  }

  loadConfig() {
    return this.config.fetchConfigState()
  }

  reset() {
    return this.config.reset()
  }
}
