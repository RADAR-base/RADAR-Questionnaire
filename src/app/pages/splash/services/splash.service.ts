import { Injectable } from '@angular/core'

import { ConfigService } from '../../../core/services/config/config.service'
import { UsageService } from '../../../core/services/data/usage.service'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { StorageService } from '../../../core/services/storage/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import { getSeconds } from '../../../shared/utilities/time'

@Injectable()
export class SplashService {
  constructor(
    public storage: StorageService,
    private alertService: AlertService,
    private configService: ConfigService,
    private usage: UsageService,
    private localization: LocalizationService
  ) {}

  evalEnrolment() {
    return this.storage.get(StorageKeys.PARTICIPANTLOGIN)
  }

  sendOpenEvent() {
    return this.usage.sendOpen(
      getSeconds({ milliseconds: new Date().getTime() })
    )
  }

  loadConfig() {
    return this.configService
      .fetchConfigState()
      .catch(e => {
        console.log(e)
        return this.alertService.showAlert({
          title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
          message: e.message,
          buttons: [
            {
              text: this.localization.translateKey(LocKeys.BTN_OKAY)
            }
          ]
        })
      })
      .then(() => this.configService.migrateToLatestVersion())
  }
}
