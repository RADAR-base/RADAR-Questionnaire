import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { IonicApp, IonicModule } from 'ionic-angular'
import { IonicStorageModule, Storage } from '@ionic/storage'
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'

import { AndroidPermissionUtility } from './shared/utilities/android-permission'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
import { AppComponent } from './core/containers/app.component'
import { AppVersion } from '@ionic-native/app-version/ngx'
import { BackgroundMode } from '@ionic-native/background-mode/ngx'
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BrowserModule } from '@angular/platform-browser'
import { Device } from '@ionic-native/device/ngx'
import { Dialogs } from '@ionic-native/dialogs/ngx'
import { File } from '@ionic-native/file/ngx'
import { Firebase } from '@ionic-native/firebase/ngx'
import { Globalization } from '@ionic-native/globalization/ngx'
import { HttpClientModule } from '@angular/common/http'
import { Insomnia } from '@ionic-native/insomnia/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { MobileAccessibility } from '@ionic-native/mobile-accessibility/ngx'
import { PagesModule } from './pages/pages.module'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Utility } from './shared/utilities/util'
import { Vibration } from '@ionic-native/vibration/ngx'
import { WebIntent } from '@ionic-native/web-intent/ngx'
import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'

@NgModule({
  imports: [
    PagesModule,
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(AppComponent, {
      mode: 'md'
    }),
    IonicStorageModule.forRoot({
      name: '__appdb',
      driverOrder: ['sqlite', 'indexeddb', 'websql']
    }),
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [Storage]
      }
    })
  ],
  declarations: [AppComponent],
  bootstrap: [IonicApp],
  entryComponents: [AppComponent],
  providers: [
    Device,
    StatusBar,
    SplashScreen,
    Utility,
    BarcodeScanner,
    Dialogs,
    Vibration,
    Globalization,
    AndroidPermissionUtility,
    AndroidPermissions,
    File,
    AppVersion,
    WebIntent,
    MobileAccessibility,
    Insomnia,
    BackgroundMode,
    Firebase,
    LocalNotifications
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
