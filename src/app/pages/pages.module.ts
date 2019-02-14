import { CommonModule, DatePipe } from '@angular/common'
import { NgModule } from '@angular/core'

import { ConfigService } from '../core/services/config.service'
import { FirebaseAnalyticsService } from '../core/services/firebaseAnalytics.service'
import { KafkaService } from '../core/services/kafka.service'
import { NotificationService } from '../core/services/notification.service'
import { SchedulingService } from '../core/services/scheduling.service'
import { StorageService } from '../core/services/storage.service'
import { PipesModule } from '../shared/pipes/pipes.module'
import { TranslatePipe } from '../shared/pipes/translate/translate'
import { AuthModule } from './auth/auth.module'
import { AuthService } from './auth/services/auth.service'
import { ClinicalTasksModule } from './clinical-tasks/clinical-tasks.module'
import { FinishModule } from './finish/finish.module'
import { HomeModule } from './home/home.module'
import { QuestionsModule } from './questions/questions.module'
import { ReportModule } from './report/report.module'
import { SettingsModule } from './settings/settings.module'
import { SplashModule } from './splash/splash.module'
import { StartModule } from './start/start.module'

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
    SplashModule,
    StartModule
  ],
  providers: [
    AuthService,
    DatePipe,
    ConfigService,
    KafkaService,
    NotificationService,
    SchedulingService,
    StorageService,
    TranslatePipe,
    FirebaseAnalyticsService
  ]
})
export class PagesModule {}
