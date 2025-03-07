import {
  ApplicationConfig,
  importProvidersFrom, inject, makeEnvironmentProviders, provideAppInitializer,
  provideZoneChangeDetection
} from '@angular/core'
import {PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading} from '@angular/router';

import { routes } from './app.routes';
import {
  provideHttpClient } from '@angular/common/http'
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { IonicRouteStrategy, ModalController } from '@ionic/angular'
import {provideIonicAngular} from "@ionic/angular/standalone";
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'
import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'
import { StorageService } from './core/services/storage/storage.service'
import { DatePipe } from '@angular/common'
import { KeyConverterService } from './core/services/kafka/converters/key-converter.service'
import { DefaultKeyConverterService } from './core/services/kafka/converters/default-key-converter.service'
import { NotificationService } from './core/services/notifications/notification.service'
import { NotificationFactoryService } from './core/services/notifications/notification-factory.service'
import { AnalyticsService } from './core/services/usage/analytics.service'
import { FirebaseAnalyticsService } from './core/services/usage/firebase-analytics.service'
import { FirebaseRemoteConfigService, RemoteConfigService } from './core/services/config/remote-config.service'
import { ScheduleService } from './core/services/schedule/schedule.service'
import { ScheduleFactoryService } from './core/services/schedule/schedule-factory.service'
import { IonicStorageModule } from '@ionic/storage-angular'
import { Drivers } from '@ionic/storage'
import CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { TokenService } from './core/services/token/token.service'
import { TokenFactoryService } from './core/services/token/token-factory.service'

const initializerFn = async (
  storageService: StorageService,
) => {
  console.log('Class: , Function: initializerFn, Line 43 ' , );
  await storageService.init();
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
    makeEnvironmentProviders([
      importProvidersFrom([
        IonicStorageModule.forRoot({
          name: '__appdb',
          driverOrder: [CordovaSQLiteDriver._driver, Drivers.IndexedDB, Drivers.LocalStorage]
        }),
        //IonicStorageModule.forRoot(),
        JwtModule.forRoot({
          jwtOptionsProvider: {
            provide: JWT_OPTIONS,
            useFactory: jwtOptionsFactory,
            deps: [StorageService]
          }
        }),
      ]),
      DatePipe,
      provideAppInitializer(async () =>
        initializerFn(
          inject(StorageService),
        )
      ),
    ]),

    ModalController,
    { provide: TokenService, useClass: TokenFactoryService },
    { provide: RemoteConfigService, useClass: FirebaseRemoteConfigService },
    { provide: ScheduleService, useClass: ScheduleFactoryService },
    { provide: KeyConverterService, useClass: DefaultKeyConverterService },
    { provide: NotificationService, useClass: NotificationFactoryService },
    { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
  ]
};
