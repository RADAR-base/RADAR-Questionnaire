import {
  ApplicationConfig,
  importProvidersFrom, inject, makeEnvironmentProviders, provideAppInitializer,
  // inject,
  // provideAppInitializer,
  provideZoneChangeDetection
} from '@angular/core'
import {PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading} from '@angular/router';

import { routes } from './app.routes';
import {
  // HttpClient,
  provideHttpClient } from '@angular/common/http'
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { IonicRouteStrategy, ModalController } from '@ionic/angular'
import {provideIonicAngular} from "@ionic/angular/standalone";
// import { PagesModule } from './pages/pages.module'
// import { IonicStorageModule } from '@ionic/storage-angular'
// import { StorageService } from './core/services/storage/storage.service'
// import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'
// import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'
// import { AlertService } from './core/services/misc/alert.service'
// import { DatePipe } from '@angular/common'
// import { ConfigService } from './core/services/config/config.service'
// import { AppConfigService } from './core/services/config/app-config.service'
// import { SubjectConfigService } from './core/services/config/subject-config.service'
// import { ProtocolService } from './core/services/config/protocol.service'
// import { QuestionnaireService } from './core/services/config/questionnaire.service'
// import { TokenService } from './core/services/token/token.service'
// import { KafkaService } from './core/services/kafka/kafka.service'
// import { LocalizationService } from './core/services/misc/localization.service'
// import { LocalScheduleService } from './core/services/schedule/local-schedule.service'
// import { AppserverScheduleService } from './core/services/schedule/appserver-schedule.service'
// import { ScheduleGeneratorService } from './core/services/schedule/schedule-generator.service'
// import { TranslatePipe } from './shared/pipes/translate/translate'
// import { UsageService } from './core/services/usage/usage.service'
// import { SchemaService } from './core/services/kafka/schema.service'
// import { NotificationGeneratorService } from './core/services/notifications/notification-generator.service'
// import { FcmRestNotificationService } from './core/services/notifications/fcm-rest-notification.service'
// import { LocalNotificationService } from './core/services/notifications/local-notification.service'
// import { AppServerService } from './core/services/app-server/app-server.service'
// import { MessageHandlerService } from './core/services/notifications/message-handler.service'
// import { NotificationService } from './core/services/notifications/notification.service'
// import { NotificationFactoryService } from './core/services/notifications/notification-factory.service'
// import { AnalyticsService } from './core/services/analytics/analytics.service'
// import { FirebaseAnalyticsService } from './core/services/analytics/firebase-analytics.service'
// import { GithubClient } from './core/services/misc/github-client.service'
// import { Utility } from './shared/utilities/util'
// import { LogService } from './core/services/misc/log.service'
// import { FirebaseRemoteConfigService, RemoteConfigService } from './core/services/config/remote-config.service'
// import { ScheduleService } from './core/services/schedule/schedule.service'
// import { ScheduleFactoryService } from './core/services/schedule/schedule-factory.service'
// import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
// import { TranslateHttpLoader } from '@ngx-translate/http-loader'
// import { provideRemoteConfig } from './core/services/remote-config/remote-config.config'
// import { AnalyticsFactoryService } from './core/services/analytics/analytics-factory.service'
// import { provideCore } from './core/core.config'
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'
import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'
import { StorageService } from './core/services/storage/storage.service'
import { DatePipe } from '@angular/common'
import { IonicStorageModule } from '@ionic/storage-angular'
import { KeyConverterService } from './core/services/kafka/converters/key-converter.service'
import { DefaultKeyConverterService } from './core/services/kafka/converters/default-key-converter.service'
import { NotificationService } from './core/services/notifications/notification.service'
import { NotificationFactoryService } from './core/services/notifications/notification-factory.service'
import { AnalyticsService } from './core/services/usage/analytics.service'
import { FirebaseAnalyticsService } from './core/services/usage/firebase-analytics.service'
import { FirebaseRemoteConfigService, RemoteConfigService } from './core/services/config/remote-config.service'
import { ScheduleService } from './core/services/schedule/schedule.service'
import { ScheduleFactoryService } from './core/services/schedule/schedule-factory.service'
// import { AlertService } from './core/services/misc/alert.service'
// import {provideCore} from "./core/core.config";
// export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }

// const initializerFn = async (
//   storageService: StorageService,
//   localeService: LocalizationService,
//   // remoteConfigService: AbstractRemoteConfigService,
//   // localeService: LocaleService,
// ) => {
//   await storageService.init();
//   await localeService.init();
//   // await remoteConfigService.forceFetch();
//   // localeService.init();
// }

const initializerFn = async (
  storageService: StorageService,
  // remoteConfigService: AbstractRemoteConfigService,
  // localeService: LocalizationService,
) => {
  console.log('Class: , Function: initializerFn, Line 43 ' , );
  await storageService.init();
  // await remoteConfigService.forceFetch();
  // await localeService.init();
}



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'md',
      scrollAssist: false,
      scrollPadding: false,
      innerHTMLTemplatesEnabled: true,
    }),
    importProvidersFrom([BrowserAnimationsModule]),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // provideCore(),

    makeEnvironmentProviders([
      importProvidersFrom([
        IonicStorageModule.forRoot(),
        JwtModule.forRoot({
          jwtOptionsProvider: {
            provide: JWT_OPTIONS,
            useFactory: jwtOptionsFactory,
            deps: [StorageService]
          }
        }),
      ]),
      DatePipe,
      // provideRemoteConfig(),
      // provideLocale(),
      // provideAnalytics(),
      // provideError(),
      // provideNotification(),
      // provideSchedule(),
      provideAppInitializer(async () =>
        initializerFn(
          inject(StorageService),
          // inject(AbstractRemoteConfigService),
          // inject(LocalizationService)
        )
      ),
    ]),

    // { provide: RemoteConfigService, useClass: FirebaseRemoteConfigService },
    // { provide: ScheduleService, useClass: ScheduleFactoryService },
    // { provide: NotificationService, useClass: NotificationFactoryService },
    // { provide: AnalyticsService, useClass: AnalyticsFactoryService },
    ModalController,
    //
    // importProvidersFrom([
    //   IonicStorageModule.forRoot(),
    //   // PagesModule,
    //   JwtModule.forRoot({
    //     jwtOptionsProvider: {
    //       provide: JWT_OPTIONS,
    //       useFactory: jwtOptionsFactory,
    //       deps: [StorageService]
    //     }
    //   }),
    //   //-------
    //   AlertService,
    //   DatePipe,
    //   // ConfigService,
    //   // AppConfigService,
    //   // SubjectConfigService,
    //   // ProtocolService,
    //   // QuestionnaireService,
    //   // TokenService,
    //   // KafkaService,
    //   // LocalizationService,
    //   // LocalScheduleService,
    //   // AppserverScheduleService,
    //   // ScheduleGeneratorService,
    //   // StorageService,
    //   // TranslatePipe,
    //   // UsageService,
    //   // SchemaService,
    //   // NotificationGeneratorService,
    //   // FcmRestNotificationService,
    //   // LocalNotificationService,
    //   // AppServerService,
    //   // MessageHandlerService,
    //   // { provide: NotificationService, useClass: NotificationFactoryService },
    //   // { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
    //   // GithubClient,
    //   //----------
    //   Utility,
    //   // LogService,
    //   // LocalScheduleService,
    //   // AppserverScheduleService,
    //   // { provide: RemoteConfigService, useClass: FirebaseRemoteConfigService },
    //   // { provide: ScheduleService, useClass: ScheduleFactoryService },
    //   // ConfigService,
    //   // AlertService,
    //   // DatePipe,
    //   // ConfigService,
    //   // AppConfigService,
    //   // SubjectConfigService,
    //   // ProtocolService,
    //   // QuestionnaireService,
    //   // TokenService,
    //   // KafkaService,
    //   // LocalizationService,
    //   // ScheduleGeneratorService,
    //   // StorageService,
    //   // TranslatePipe,
    //   // UsageService,
    //   // SchemaService,
    //   // ConverterFactoryService,
    //   // AssessmentConverterService,
    //   // AppEventConverterService,
    //   // CompletionLogConverterService,
    //   // TimezoneConverterService,
    //   // KeyConverterService,
    //   // HealthkitConverterService,
    //   // CacheService,
    //   // NotificationGeneratorService,
    //   // FcmRestNotificationService,
    //   // LocalNotificationService,
    //   // AppServerService,
    //   // MessageHandlerService,
    //   // { provide: NotificationService, useClass: NotificationFactoryService },
    //   // { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
    //   // GithubClient,
    //
    //
    //
    // ]),
    // {
    //   provide: TranslateLoader,
    //   useFactory: HttpLoaderFactory,
    //   deps: [HttpClient],
    // },
    // // TranslateService, // Provides TranslateService
    // importProvidersFrom([
    //   TranslateModule.forRoot({
    //     loader: {
    //       provide: TranslateLoader,
    //       useFactory: HttpLoaderFactory,
    //       deps: [HttpClient],
    //     },
    //   }),
    // ]),
    // provideRemoteConfig(),
    // // provideLocale(),
    // // provideCore()
    // provideAppInitializer(async () => initializerFn(inject(StorageService), inject(LocalizationService))),
    { provide: RemoteConfigService, useClass: FirebaseRemoteConfigService },
    { provide: ScheduleService, useClass: ScheduleFactoryService },
    { provide: KeyConverterService, useClass: DefaultKeyConverterService },
    { provide: NotificationService, useClass: NotificationFactoryService },
    { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
  ]
};
