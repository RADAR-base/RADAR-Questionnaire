import { CommonModule, DatePipe } from '@angular/common'
import { NgModule } from '@angular/core'

import { AppServerService } from '../core/services/app-server/app-server.service'
import { AppConfigService } from '../core/services/config/app-config.service'
import { ConfigService } from '../core/services/config/config.service'
import { ProtocolService } from '../core/services/config/protocol.service'
import { QuestionnaireService } from '../core/services/config/questionnaire.service'
import { SubjectConfigService } from '../core/services/config/subject-config.service'
import { KafkaService } from '../core/services/kafka/kafka.service'
import { SchemaService } from '../core/services/kafka/schema.service'
import { AlertService } from '../core/services/misc/alert.service'
import { GithubClient } from '../core/services/misc/github-client.service'
import { LocalizationService } from '../core/services/misc/localization.service'
import { FcmRestNotificationService } from '../core/services/notifications/fcm-rest-notification.service'
import { LocalNotificationService } from '../core/services/notifications/local-notification.service'
import { MessageHandlerService } from '../core/services/notifications/message-handler.service'
import { NotificationFactoryService } from '../core/services/notifications/notification-factory.service'
import { NotificationGeneratorService } from '../core/services/notifications/notification-generator.service'
import { NotificationService } from '../core/services/notifications/notification.service'
import { AppserverScheduleService } from '../core/services/schedule/appserver-schedule.service'
import { LocalScheduleService } from '../core/services/schedule/local-schedule.service'
import { ScheduleFactoryService } from '../core/services/schedule/schedule-factory.service'
import { ScheduleGeneratorService } from '../core/services/schedule/schedule-generator.service'
import { ScheduleService } from '../core/services/schedule/schedule.service'
import { GlobalStorageService } from '../core/services/storage/global-storage.service'
import { StorageService } from '../core/services/storage/storage.service'
import { TokenService } from '../core/services/token/token.service'
import { AnalyticsService } from '../core/services/usage/analytics.service'
import { FirebaseAnalyticsService } from '../core/services/usage/firebase-analytics.service'
import { UsageService } from '../core/services/usage/usage.service'
import { PipesModule } from '../shared/pipes/pipes.module'
import { TranslatePipe } from '../shared/pipes/translate/translate'
import { AuthModule } from './auth/auth.module'
import { ClinicalTasksModule } from './clinical-tasks/clinical-tasks.module'
import { HomeModule } from './home/home.module'
import { OnDemandModule } from './on-demand/on-demand.module'
import { QuestionsModule } from './questions/questions.module'
import { ReportModule } from './report/report.module'
import { SettingsModule } from './settings/settings.module'
import { SplashModule } from './splash/splash.module'

@NgModule({
  imports: [
    PipesModule,
    CommonModule,
    AuthModule,
    ClinicalTasksModule,
    OnDemandModule,
    HomeModule,
    QuestionsModule,
    ReportModule,
    SettingsModule,
    SplashModule
  ],
  providers: [
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
    LocalScheduleService,
    AppserverScheduleService,
    ScheduleGeneratorService,
    GlobalStorageService,
    { provide: StorageService, useClass: GlobalStorageService },
    TranslatePipe,
    UsageService,
    SchemaService,
    NotificationGeneratorService,
    FcmRestNotificationService,
    LocalNotificationService,
    AppServerService,
    MessageHandlerService,
    { provide: NotificationService, useClass: NotificationFactoryService },
    { provide: AnalyticsService, useClass: FirebaseAnalyticsService },
    GithubClient
  ]
})
export class PagesModule {}
