import { Component } from '@angular/core'
import { Device } from '@ionic-native/device'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'
import { HomePage } from '../pages/home/home'
import { FirebaseService } from '../providers/firebase-service'
import { AndroidPermissionUtility } from '../utilities/android-permission'

@Component({
  template:
  '<ion-nav [root]="rootPage"></ion-nav>'
})
export class MyApp {
  rootPage = HomePage

  constructor(
    private device: Device,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private firebaseService: FirebaseService,
    private androidPermission: AndroidPermissionUtility
  ) {
    platform.ready().then(() => {
      statusBar.styleDefault()
      splashScreen.hide()
      firebaseService.fetchConfigState()
      androidPermission.AuthorizePermissions()
    })
  }
}
