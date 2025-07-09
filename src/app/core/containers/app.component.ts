import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { register } from 'swiper/element/bundle'
import { TextZoom } from '@capacitor/text-zoom'
import { Capacitor } from '@capacitor/core'

import { SplashPageComponent } from '../../pages/splash/containers/splash-page.component'
import { TokenService } from '../services/token/token.service'

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  rootPage = SplashPageComponent
  isAppInitialized: boolean

  constructor(private platform: Platform) {
    register()
    this.platform.ready().then(() => {
      if (Capacitor.isPluginAvailable('TextZoom')) TextZoom.set({ value: 1 })
      this.isAppInitialized = true
    })
  }
}
