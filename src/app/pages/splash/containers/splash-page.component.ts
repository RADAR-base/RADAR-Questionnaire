import { Component, OnDestroy } from '@angular/core'
import { NavController, Platform } from '@ionic/angular'

import { DefaultPackageName } from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { SplashService } from '../services/splash.service'

declare var window

const SPLASH_SAFETY_TIMEOUT_MS = 120_000

@Component({
  selector: 'page-splash',
  templateUrl: 'splash-page.component.html',
  styleUrls: ['./splash-page.component.scss']
})
export class SplashPageComponent implements OnDestroy {
  status = 'Checking enrolment...'
  private navigated = false
  private safetyTimer: any

  constructor(
    public navCtrl: NavController,
    private splashService: SplashService,
    private alertService: AlertService,
    private localization: LocalizationService,
    private usage: UsageService,
    private platform: Platform
  ) {
    this.safetyTimer = setTimeout(() => this.onSafetyTimeout(), SPLASH_SAFETY_TIMEOUT_MS)

    this.splashService
      .isEnrolled()
      .then(enrolled =>
        enrolled
          ? this.splashService
            .evalEnrolment()
            .then(valid =>
              valid ? !!this.onStart() : !!this.resetAndEnrol()
            )
          : this.enrol()
      )
      .catch(e => {
        console.error('[SPLASH] Unhandled error in init chain:', e)
        this.navigateAway('/enrol')
      })
  }

  ngOnDestroy() {
    this.clearSafetyTimer()
  }

  private clearSafetyTimer() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer)
      this.safetyTimer = null
    }
  }

  private onSafetyTimeout() {
    console.error('[SPLASH] Safety timeout reached — forcing navigation away from splash screen')
    if (!this.navigated) {
      this.navigateAway('/enrol')
    }
  }

  private navigateAway(route: string) {
    if (this.navigated) return Promise.resolve(false)
    this.navigated = true
    this.clearSafetyTimer()
    return this.navCtrl.navigateRoot(route)
  }

  onStart() {
    this.usage.sendOpenEvent()
    this.usage.setPage(this.constructor.name)
    this.status = this.localization.translateKey(
      LocKeys.SPLASH_STATUS_UPDATING_CONFIG
    )
    this.splashService
      .isAppUpdateAvailable()
      .then(res => (res ? this.showAppUpdateAvailable() : []))
      .catch(() => { })
    return this.splashService
      .loadConfig()
      .then(() => {
        this.splashService
          .sendMissedQuestionnaireLogs()
          .then(() => this.splashService.sendReportedIncompleteTasks())
          .catch(e => console.warn('Background log sending failed:', e))
        return this.navigateAway('/home')
      })
      .catch(e => this.showFetchConfigFail(e))
      .finally(() => this.navigateAway('/home'))
  }

  showFetchConfigFail(e) {
    this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.STATUS_SORRY) + "!",
      message: this.localization.translateKey(LocKeys.CONFIG_ERROR_DESC),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_RETRY),
          handler: () => {
            this.onStart()
          }
        },
        {
          text: this.localization.translateKey(LocKeys.BTN_DISMISS),
          handler: () => { }
        }
      ]
    })
  }

  showAppUpdateAvailable() {
    this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.STATUS_UPDATE_AVAILABLE),
      message: this.localization.translateKey(
        LocKeys.STATUS_UPDATE_AVAILABLE_DESC
      ),
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_UPDATE),
          handler: () => {
            this.openApplicationStore()
          }
        }
      ]
    })
  }

  openApplicationStore() {
    const url = this.platform.is('ios')
      ? 'itms-apps://itunes.apple.com/app/'
      : 'market://details?id=' + DefaultPackageName
    window.location.replace(url)
  }

  resetAndEnrol() {
    return this.splashService.reset()
      .catch(e => console.warn('[SPLASH] Reset failed, proceeding to enrol:', e))
      .then(() => this.enrol())
  }

  enrol() {
    return this.navigateAway('/enrol')
  }
}
