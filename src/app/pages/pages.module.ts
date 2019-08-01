import { CommonModule, DatePipe } from '@angular/common'

import { AlertService } from '../core/services/misc/alert.service'
import { AppConfigService } from '../core/services/config/app-config.service'
import { AuthModule } from './auth/auth.module'
import { ClinicalTasksModule } from './clinical-tasks/clinical-tasks.module'
import { ConfigService } from '../core/services/config/config.service'
import { FcmNotificationService } from '../core/services/notifications/fcm-notification.service'
import { FinishModule } from './finish/finish.module'
import { FirebaseAnalyticsService } from '../core/services/usage/firebase-analytics.service'
import { HomeModule } from './home/home.module'
import { KafkaService } from '../core/services/kafka/kafka.service'
import { LocalNotificationService } from '../core/services/notifications/local-notification.service'
import { LocalizationService } from '../core/services/misc/localization.service'
import { NgModule } from '@angular/core'
import { NotificationGeneratorService } from '../core/services/notifications/notification-generator.service'
import { NotificationService } from '../core/services/notifications/notification.service'
import { PipesModule } from '../shared/pipes/pipes.module'
import { ProtocolService } from '../core/services/config/protocol.service'
import { QuestionnaireService } from '../core/services/config/questionnaire.service'
import { QuestionsModule } from './questions/questions.module'
import { ReportModule } from './report/report.module'
import { ScheduleGeneratorService } from '../core/services/schedule/schedule-generator.service'
import { ScheduleService } from '../core/services/schedule/schedule.service'
import { SchemaService } from '../core/services/kafka/schema.service'
import { SettingsModule } from './settings/settings.module'
import { SplashModule } from './splash/splash.module'
import { StorageService } from '../core/services/storage/storage.service'
import { SubjectConfigService } from '../core/services/config/subject-config.service'
import { TokenService } from '../core/services/token/token.service'
import { TranslatePipe } from '../shared/pipes/translate/translate'
import { UsageService } from '../core/services/usage/usage.service'

@NgModule({
  imports: [
    PipesModule,
    CommonModule,
    AuthModule,
    ClinicalTasksModule,
    FinishModule,
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
    ScheduleService,
    ScheduleGeneratorService,
    StorageService,
    TranslatePipe,
    UsageService,
    SchemaService,
    NotificationGeneratorService,
    { provide: NotificationService, useClass: FcmNotificationService },
    FirebaseAnalyticsService
  ]
})
export class PagesModule {}
