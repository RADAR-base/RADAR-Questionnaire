import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { EnrolmentPageComponent } from '../../auth/containers/enrolment-page.component'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { SplashService } from '../services/splash.service'

@Component({
  selector: 'page-splash',
  templateUrl: 'splash-page.component.html'
})
export class SplashPageComponent {
  status = 'Checking enrolment...'
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private splash: SplashService,
    private alertService: AlertService,
    private localization: LocalizationService,
    private usage: UsageService
  ) {
    this.splash
      .evalEnrolment()
      .then(valid => (valid ? this.onStart() : this.enrol()))
  }

  onStart() {
    this.usage.sendOpenEvent()
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
      .catch(e => this.showFetchConfigFail(e))
      .then(() => this.navCtrl.setRoot(HomePageComponent))
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
            this.enrol()
          }
        }
      ]
    })
  }

  enrol() {
    this.splash.reset().then(() => this.navCtrl.setRoot(EnrolmentPageComponent))
  }
}
