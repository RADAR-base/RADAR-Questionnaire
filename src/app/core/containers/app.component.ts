import { Component } from '@angular/core'
import { StatusBar } from '@capacitor/status-bar'
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
  ) {
    this.platform.ready().then(() => {
      StatusBar.hide()
      this.isAppInitialized = true
    })
  }
}
