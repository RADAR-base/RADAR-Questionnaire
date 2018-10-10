import { Component } from '@angular/core'
import { Device } from '@ionic-native/device'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'

import { SplashPage } from '../../pages/splash/splash'
import { ConfigService } from '../services/config.service'
import { KafkaService } from '../services/kafka.service'
import { NotificationService } from '../services/notification.service'

@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>'
})
export class AppComponent {
  rootPage = SplashPage

  constructor(
    private device: Device,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private configService: ConfigService,
    private kafkaService: KafkaService,
    private notificationService: NotificationService
  ) {
    platform.ready().then(() => {
      statusBar.styleDefault()
      splashScreen.hide()
      configService.fetchConfigState(false)
      configService.migrateToLatestVersion()
      notificationService.permissionCheck()
    })
  }
}
