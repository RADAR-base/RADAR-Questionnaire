import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class SplashService {
  constructor(public storage: StorageService) {}

  evalEnrolment() {
    return this.storage.get(StorageKeys.PARTICIPANTLOGIN)
  }
}
