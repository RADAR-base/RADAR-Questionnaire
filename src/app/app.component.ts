import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'
import { Storage } from '@ionic/storage'
import { NotificationSettings } from '../models/settings'
import { ConfigDataProvider } from '../providers/config-data';
//import { HomePage } from '../pages/home/home'
import { SettingsPage } from '../pages/settings/settings'

@Component({
  template:
    '<ion-nav [root]="rootPage"></ion-nav>'
})
export class MyApp {
  rootPage = SettingsPage

  constructor (
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    public storage: Storage,
    private configProvider : ConfigDataProvider,
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
