import { DatePipe } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterModule } from '@angular/router'
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
import { AppLauncher } from '@ionic-native/app-launcher/ngx'
import { AppVersion } from '@ionic-native/app-version/ngx'
import { BackgroundMode } from '@ionic-native/background-mode/ngx'
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx'
import { Device } from '@ionic-native/device/ngx'
import { Dialogs } from '@ionic-native/dialogs/ngx'
import { File } from '@ionic-native/file/ngx'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Globalization } from '@ionic-native/globalization/ngx'
import { Insomnia } from '@ionic-native/insomnia/ngx'
import { Keyboard } from '@ionic-native/keyboard/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { MobileAccessibility } from '@ionic-native/mobile-accessibility/ngx'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { Vibration } from '@ionic-native/vibration/ngx'
import { WebIntent } from '@ionic-native/web-intent/ngx'
import { IonicModule } from '@ionic/angular'
import { IonicStorageModule, Storage } from '@ionic/storage'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './core/containers/app.component'
import { AppServerService } from './core/services/app-server/app-server.service'
import { AppConfigService } from './core/services/config/app-config.service'
import { ConfigService } from './core/services/config/config.service'
import { ProtocolService } from './core/services/config/protocol.service'
import { QuestionnaireService } from './core/services/config/questionnaire.service'
import {
  FirebaseRemoteConfigService,
  RemoteConfigService
} from './core/services/config/remote-config.service'
import { SubjectConfigService } from './core/services/config/subject-config.service'
import { KafkaService } from './core/services/kafka/kafka.service'
import { SchemaService } from './core/services/kafka/schema.service'
import { AlertService } from './core/services/misc/alert.service'
import { GithubClient } from './core/services/misc/github-client.service'
import { LocalizationService } from './core/services/misc/localization.service'
import { LogService } from './core/services/misc/log.service'
import { FcmRestNotificationService } from './core/services/notifications/fcm-rest-notification.service'
import { FcmXmppNotificationService } from './core/services/notifications/fcm-xmpp-notification.service'
import { LocalNotificationService } from './core/services/notifications/local-notification.service'
import { MessageHandlerService } from './core/services/notifications/message-handler.service'
import { NotificationFactoryService } from './core/services/notifications/notification-factory.service'
import { NotificationGeneratorService } from './core/services/notifications/notification-generator.service'
import { NotificationService } from './core/services/notifications/notification.service'
import { AppserverScheduleService } from './core/services/schedule/appserver-schedule.service'
import { LocalScheduleService } from './core/services/schedule/local-schedule.service'
import { ScheduleFactoryService } from './core/services/schedule/schedule-factory.service'
import { ScheduleGeneratorService } from './core/services/schedule/schedule-generator.service'
import { ScheduleService } from './core/services/schedule/schedule.service'
import { StorageService } from './core/services/storage/storage.service'
import { TokenService } from './core/services/token/token.service'
import { AnalyticsService } from './core/services/usage/analytics.service'
import { FirebaseAnalyticsService } from './core/services/usage/firebase-analytics.service'
import { UsageService } from './core/services/usage/usage.service'
import { PagesModule } from './pages/pages.module'
import { TranslatePipe } from './shared/pipes/translate/translate'
import { AndroidPermissionUtility } from './shared/utilities/android-permission'
import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'
import { Utility } from './shared/utilities/util'

@NgModule({
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    IonicModule.forRoot({
      mode: 'md',
      scrollAssist: false,
      scrollPadding: false
    }),
    RouterModule.forRoot([]),
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
    }),
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
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
    Keyboard,
    FirebaseX,
    LocalNotifications,
    LogService,
    LocalScheduleService,
    AppserverScheduleService,
    { provide: RemoteConfigService, useClass: FirebaseRemoteConfigService },
    { provide: ScheduleService, useClass: ScheduleFactoryService },
    ConfigService,
    AlertService,
    DatePipe,
    ConfigService,
    AppConfigService,
    SubjectConfigService,
    ProtocolService,
    QuestionnaireService,
    TokenService,
    KafkaService,
    LocalizationService,
    ScheduleGeneratorService,
    StorageService,
    TranslatePipe,
    UsageService,
    SchemaService,
    NotificationGeneratorService,
    FcmRestNotificationService,
    FcmXmppNotificationService,
    LocalNotificationService,
    AppServerService,
    MessageHandlerService,
    { provide: NotificationService, useClass: NotificationFactoryService },
    { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
    GithubClient,
    AppLauncher
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
