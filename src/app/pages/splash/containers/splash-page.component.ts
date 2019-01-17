import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

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
    private splash: SplashService
  ) {
    this.splash
      .evalEnrolment()
      .then(
        participant =>
          participant
            ? this.onStart()
            : this.navCtrl.setRoot(EnrolmentPageComponent)
      )
  }

  onStart() {
    this.status = 'Updating notifications...'
    return this.splash
      .checkTimezoneChange()
      .then(() => this.splash.notificationsRefresh())
      .catch(e => console.log('[SPLASH] Notifications error.'))
      .then(() => {
        this.status = 'Sending usage event...'
        return this.splash.sendOpenEvent()
      })
      .catch(e => console.log('[SPLASH] Error sending data'))
      .then(() => this.navCtrl.setRoot(HomePageComponent))
  }
}
