import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'
import { Storage } from '@ionic/storage'

import { HomePage } from '../pages/home/home'

@Component({
  template: `
    <ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
  rootPage = HomePage

  constructor (
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    public storage: Storage
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
    var storeHasKeys = false
    this.storage.keys().then((keys) => {
      if(keys.length > 1){
        storeHasKeys = true
      }
    })
    console.log(storeHasKeys)
    let today = new Date()
    this.storage.set('referenceDate', today.getTime()).then(() => {})
  }
}
