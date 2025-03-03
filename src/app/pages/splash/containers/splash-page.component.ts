import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { IonicModule, NavController, Platform } from '@ionic/angular'

import { DefaultPackageName } from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { UsageService } from '../../../core/services/usage/usage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { EnrolmentPageComponent } from '../../auth/containers/enrolment-page.component'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { SplashService } from '../services/splash.service'
import { IonContent, IonSpinner } from '@ionic/angular/standalone'

declare var window

@Component({
  selector: 'page-splash',
  templateUrl: 'splash-page.component.html',
  styleUrls: ['./splash-page.component.scss'],
  imports: [IonSpinner, IonContent]
})
export class SplashPageComponent {
  status = 'Checking enrolment...'
  constructor(
    public navCtrl: NavController,
    private splashService: SplashService,
    private alertService: AlertService,
    private localization: LocalizationService,
    private usage: UsageService,
    private platform: Platform,
    private router: Router
  ) {
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
    return this.splashService
      .loadConfig()
      .then(() => {
        this.status = this.localization.translateKey(
          LocKeys.SPLASH_STATUS_SENDING_LOGS
        )
        return this.splashService
          .sendMissedQuestionnaireLogs()
          .then(() => this.splashService.sendReportedIncompleteTasks())
      })
      .catch(e => this.showFetchConfigFail(e))
      .then(() => this.navCtrl.navigateRoot('/home'))
  }

  showFetchConfigFail(e) {
    console.log(e)
    this.alertService.showAlert({
      header: this.localization.translateKey(LocKeys.STATUS_FAILURE),
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
          handler: () => {}
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
    return this.splashService.reset().then(() => this.enrol())
  }

  enrol() {
    return this.navCtrl.navigateRoot('/enrol')
  }
}
