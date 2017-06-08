import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'
import { FirebaseService } from '../providers/firebase-service';
import { StorageService } from '../providers/storage-service'
import { NotificationSettings } from '../models/settings'
import { HomePage } from '../pages/home/home'


@Component({
  template:
  '<ion-nav [root]="rootPage"></ion-nav>'
})
export class MyApp {
  rootPage = HomePage

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private firebaseService: FirebaseService,
    public storage: StorageService,
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault()
      splashScreen.hide()
      this.storage.init('patientId')
    })
  }
}
