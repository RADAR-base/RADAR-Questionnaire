import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'

@Injectable()
export class SplashService {
  constructor(public storage: StorageService) {}

  evalEnrolment() {
    return this.storage.getAllKeys().then(keys => {
      // TODO: Remove hardcoded number
      return keys.length <= 5
    })
  }
}
