import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'

import { DefaultNotificationType } from '../../../assets/data/defaultConfig'
import { SplashPageComponent } from '../../pages/splash/containers/splash-page.component'
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
    private notificationService: NotificationService
  ) {
    this.platform.ready().then(() => {
      this.statusBar.hide()
      this.splashScreen.hide()
      if (DefaultNotificationType === 'LOCAL')
        this.notificationService.permissionCheck()
    })
  }
}
