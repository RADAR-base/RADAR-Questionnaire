import { Component } from '@angular/core'
import { StatusBar } from '@capacitor/status-bar'
import { Platform } from '@ionic/angular'

import { SplashPageComponent } from '../../pages/splash/containers/splash-page.component'
import { Capacitor } from '@capacitor/core'

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  rootPage = SplashPageComponent
  isAppInitialized: boolean

  constructor(private platform: Platform) {
    this.platform.ready().then(() => {
      if (Capacitor.isNativePlatform()) {
        StatusBar.hide()
      }
      this.isAppInitialized = true
    })
  }
}
