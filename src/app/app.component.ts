import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'
import { FirebaseService } from '../providers/firebase-service';
import { Storage } from '@ionic/storage'
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
    public storage: Storage,
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault()
      splashScreen.hide()
      this.evalStore()
    })
  }

  evalStore () {
    this.storage.keys().then((keys) => {
      let defaultNotificationSettings: NotificationSettings = {
        sound: true,
        vibration: false,
        nightMode: true
      }
      if(keys.length == 0){
        let today = new Date()
        this.storage.set('referenceDate', today.getTime())
        this.storage.set('patientId', '123456789')
        this.storage.set('language', 'English')
        this.storage.set('notificationSettings', defaultNotificationSettings)
      }
    })
  }
}
