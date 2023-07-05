import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'

import { LogService } from '../misc/log.service'
import { StorageService } from './storage.service'

@Injectable()
export class GlobalStorageService extends StorageService {
  constructor(
    public storage: Storage,
    public logger: LogService,
    public platform: Platform
  ) {
    super(storage, logger, platform)
  }
}
