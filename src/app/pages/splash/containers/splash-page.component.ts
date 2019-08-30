import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { SplashService } from '../services/splash.service'

@Component({
  selector: 'page-splash',
  templateUrl: 'splash-page.component.html'
})
export class SplashPageComponent implements OnInit {
  status = 'Checking enrolment...'
  constructor(
    private router: Router,
    private splash: SplashService,
    private alertService: AlertService,
    private localization: LocalizationService,
    private usage: UsageService
  ) {}

  ngOnInit() {
    this.onStart()
  }

  onStart() {
    this.usage.setPage(this.constructor.name)
    this.status = this.localization.translateKey(
      LocKeys.SPLASH_STATUS_UPDATING_CONFIG
    )
    return this.splash
      .loadConfig()
      .then(() => {
        this.status = this.localization.translateKey(
          LocKeys.SPLASH_STATUS_SENDING_LOGS
        )
        return this.splash.sendMissedQuestionnaireLogs()
      })
      .catch(e => console.log('[SPLASH] Notifications error.'))
      .then(() => {
        this.router.navigate(['/home'])
      })
  }

  showFetchConfigFail(e) {
    this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
      message: e.message,
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_RETRY),
          handler: () => {
            this.onStart()
          }
        },
        {
          text: this.localization.translateKey(LocKeys.BTN_RESET),
          handler: () => {
            this.splash.reset().then(() => this.router.navigate(['/enrol']))
          }
        }
      ]
    })
  }
}
