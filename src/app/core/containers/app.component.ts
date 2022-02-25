import { Component } from '@angular/core'
import { MobileAccessibility } from '@ionic-native/mobile-accessibility/ngx'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Platform } from '@ionic/angular'

import { SplashPageComponent } from '../../pages/splash/containers/splash-page.component'

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  rootPage = SplashPageComponent
  isAppInitialized: boolean

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private accessibility: MobileAccessibility
  ) {
    this.platform.ready().then(() => {
      this.accessibility.usePreferredTextZoom(false)
      this.statusBar.hide()
      this.isAppInitialized = true
      this.splashScreen.hide()
    })
  }
}
