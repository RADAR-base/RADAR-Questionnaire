import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'

import { SplashPageComponent } from '../../pages/splash/containers/splash-page.component'
import { ConfigService } from '../services/config.service'
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
    private configService: ConfigService
  ) {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault()
      this.splashScreen.hide()
      this.configService.fetchConfigState(false)
      this.configService.migrateToLatestVersion()
    })
  }
}
