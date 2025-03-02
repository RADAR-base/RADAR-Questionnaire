import { DatePipe } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterModule } from '@angular/router'
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'
import { IonicModule } from '@ionic/angular'

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
import { CacheService } from './core/services/kafka/cache.service'
import { AppEventConverterService } from './core/services/kafka/converters/app-event-converter.service'
import { AssessmentConverterService } from './core/services/kafka/converters/assessment-converter.service'
import { CompletionLogConverterService } from './core/services/kafka/converters/completion-log-converter.service'
import { ConverterFactoryService } from './core/services/kafka/converters/converter-factory.service.'
import { ConverterService } from './core/services/kafka/converters/converter.service'
import { HealthkitConverterService } from './core/services/kafka/converters/healthkit-converter.service'
import { TimezoneConverterService } from './core/services/kafka/converters/timezone-converter.service'
import { KafkaService } from './core/services/kafka/kafka.service'
import { SchemaService } from './core/services/kafka/schema.service'
import { AlertService } from './core/services/misc/alert.service'
import { GithubClient } from './core/services/misc/github-client.service'
import { LocalizationService } from './core/services/misc/localization.service'
import { LogService } from './core/services/misc/log.service'
import { FcmRestNotificationService } from './core/services/notifications/fcm-rest-notification.service'
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
import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'
import { Utility } from './shared/utilities/util'
import { DefaultKeyConverterService } from './core/services/kafka/converters/default-key-converter.service'
import { KeyConverterService } from './core/services/kafka/converters/key-converter.service'
import { IonicStorageModule } from '@ionic/storage-angular'

export const initializeFn = (storage: StorageService) => {
  return () => storage.init()
}

@NgModule({
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    IonicModule.forRoot({
      mode: 'md',
      scrollAssist: false,
      scrollPadding: false,
      innerHTMLTemplatesEnabled: true
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
        deps: [StorageService]
      }
    }),
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFn,
      deps: [StorageService],
      multi: true
    },
    Utility,
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
    ConverterFactoryService,
    AssessmentConverterService,
    AppEventConverterService,
    CompletionLogConverterService,
    TimezoneConverterService,
    HealthkitConverterService,
    { provide: KeyConverterService, useClass: DefaultKeyConverterService },
    CacheService,
    NotificationGeneratorService,
    FcmRestNotificationService,
    LocalNotificationService,
    AppServerService,
    MessageHandlerService,
    { provide: NotificationService, useClass: NotificationFactoryService },
    { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
    GithubClient,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
