import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
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
    private localization: LocalizationService
  ) {
    this.splash
      .evalEnrolment()
      .then(() => this.onStart())
      .catch(e => this.enrol())
  }

  onStart() {
    this.status = 'Updating notifications and schedule...'
    return this.splash
      .loadConfig()
      .then(() => this.navCtrl.setRoot(HomePageComponent))
      .catch(e => {
        console.log('[SPLASH] Notifications error.')
        return this.showFetchConfigFail(e)
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
