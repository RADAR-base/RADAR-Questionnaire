import { CommonModule, DatePipe } from '@angular/common'
import { NgModule } from '@angular/core'

import { AlertService } from '../core/services/alert.service'
import { ConfigService } from '../core/services/config.service'
import { FcmNotificationService } from '../core/services/fcm-notification.service'
import { KafkaService } from '../core/services/kafka.service'
import { LocalizationService } from '../core/services/localization.service'
import { NotificationGeneratorService } from '../core/services/notification-generator.service'
import { NotificationService } from '../core/services/notification.service'
import { SchedulingService } from '../core/services/scheduling.service'
import { SchemaService } from '../core/services/schema.service'
import { StorageService } from '../core/services/storage.service'
import { TokenService } from '../core/services/token.service'
import { UsageService } from '../core/services/usage.service'
import { PipesModule } from '../shared/pipes/pipes.module'
import { TranslatePipe } from '../shared/pipes/translate/translate'
import { AuthModule } from './auth/auth.module'
import { ClinicalTasksModule } from './clinical-tasks/clinical-tasks.module'
import { FinishModule } from './finish/finish.module'
import { HomeModule } from './home/home.module'
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
    TokenService,
    KafkaService,
    LocalizationService,
    SchedulingService,
    StorageService,
    TranslatePipe,
    UsageService,
    SchemaService,
    NotificationGeneratorService,
    { provide: NotificationService, useClass: FcmNotificationService }
  ]
})
export class PagesModule {}
