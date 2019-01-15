import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'

import { SplashPageComponent } from '../../pages/splash/containers/splash-page.component'
import { LocKeys } from '../../shared/enums/localisations'
import { AlertService } from '../services/alert.service'
import { ConfigService } from '../services/config.service'
import { LocalizationService } from '../services/localization.service'
import { NotificationService } from '../services/notification.service'

@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>'
})
export class AppComponent {
  rootPage = SplashPageComponent

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private configService: ConfigService,
    private notificationService: NotificationService,
    private alertService: AlertService,
    private localization: LocalizationService
  ) {
    this.platform.ready().then(() => {
      this.statusBar.hide()
      this.splashScreen.hide()
      this.configService.fetchConfigState(false).catch(e => {
        console.log(e)
        return alertService.showAlert({
          title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
          message: e.message,
          buttons: [
            {
              text: this.localization.translateKey(LocKeys.BTN_OKAY)
            }
          ]
        })
      })
      this.configService.migrateToLatestVersion()
      return this.notificationService.permissionCheck()
    })
  }
}
