import { DatePipe } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt'
import { AndroidPermissions } from '@ionic-native/android-permissions'
import { AppVersion } from '@ionic-native/app-version'
import { BarcodeScanner } from '@ionic-native/barcode-scanner'
import { Device } from '@ionic-native/device'
import { Dialogs } from '@ionic-native/dialogs'
import { File } from '@ionic-native/file'
import { Globalization } from '@ionic-native/globalization'
import { LocalNotifications } from '@ionic-native/local-notifications'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Vibration } from '@ionic-native/vibration'
import { IonicStorageModule, Storage } from '@ionic/storage'
import { RoundProgressModule } from 'angular-svg-round-progressbar'
import { MomentModule } from 'angular2-moment'
import { IonicApp, IonicModule } from 'ionic-angular'

import { AppComponent } from './core/containers/app.component'
import { ConfigService } from './core/services/config.service'
import { HomeController } from './core/services/home-controller.service'
import { KafkaService } from './core/services/kafka.service'
import { NotificationService } from './core/services/notification.service'
import { SchedulingService } from './core/services/scheduling.service'
import { StorageService } from './core/services/storage.service'
import { EnrolmentPageComponent } from './pages/auth/containers/enrolment-page.component'
import { AuthService } from './pages/auth/services/auth.service'
import { ClinicalTasksPageComponent } from './pages/clinical-tasks/containers/clinical-tasks-page.component'
import { FinishPageComponent } from './pages/finish/containers/finish-page.component'
import { PrepareDataService } from './pages/finish/services/prepare-data.service'
import { TaskCalendarComponent } from './pages/home/components/task-calendar/task-calendar.component'
import { TaskInfoComponent } from './pages/home/components/task-info/task-info.component'
import { TaskProgressComponent } from './pages/home/components/task-progress/task-progress.component'
import { TickerBarComponent } from './pages/home/components/ticker-bar/ticker-bar.component'
import { HomePageComponent } from './pages/home/containers/home-page.component'
import { InfoScreenComponent } from './pages/questions/components/info-screen/info-screen.component'
import { AudioInputComponent } from './pages/questions/components/question/audio-input/audio-input.component'
import { CheckboxInputComponent } from './pages/questions/components/question/checkbox-input/checkbox-input.component'
import { QuestionComponent } from './pages/questions/components/question/question.component'
import { RadioInputComponent } from './pages/questions/components/question/radio-input/radio-input.component'
import { RangeInputComponent } from './pages/questions/components/question/range-input/range-input.component'
import { SliderInputComponent } from './pages/questions/components/question/slider-input/slider-input.component'
import { TimedTestComponent } from './pages/questions/components/question/timed-test/timed-test.component'
import { QuestionsPageComponent } from './pages/questions/containers/questions-page.component'
import { AnswerService } from './pages/questions/services/answer.service'
import { AudioRecordService } from './pages/questions/services/audio-record.service'
import { TimeStampService } from './pages/questions/services/timestamp.service'
import { ReportPageComponent } from './pages/report/containers/report-page.component'
import { SettingsPageComponent } from './pages/settings/containers/settings-page.component'
import { SplashPageComponent } from './pages/splash/containers/splash-page.component'
import { StartPageComponent } from './pages/start/containers/start-page.component'
import { PipesModule } from './shared/pipes/pipes.module'
import { TranslatePipe } from './shared/pipes/translate/translate'
import { AndroidPermissionUtility } from './shared/utilities/android-permission'
import { jwtOptionsFactory } from './shared/utilities/jwtOptionsFactory'
import { Utility } from './shared/utilities/util'

@NgModule({
  imports: [
    HttpClientModule,
    MomentModule,
    BrowserModule,
    RoundProgressModule,
    BrowserAnimationsModule,
    PipesModule,
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
  declarations: [
    AppComponent,

    // Pages
    SplashPageComponent,
    EnrolmentPageComponent,
    HomePageComponent,
    ClinicalTasksPageComponent,
    StartPageComponent,
    QuestionsPageComponent,
    FinishPageComponent,
    SettingsPageComponent,
    ReportPageComponent,

    // Components
    TaskCalendarComponent,
    TaskProgressComponent,
    TickerBarComponent,
    TaskInfoComponent,
    QuestionComponent,
    RangeInputComponent,
    RadioInputComponent,
    SliderInputComponent,
    TimedTestComponent,
    InfoScreenComponent,
    CheckboxInputComponent,
    AudioInputComponent
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    AppComponent,

    // Pages
    SplashPageComponent,
    EnrolmentPageComponent,
    HomePageComponent,
    ClinicalTasksPageComponent,
    StartPageComponent,
    QuestionsPageComponent,
    FinishPageComponent,
    SettingsPageComponent,
    ReportPageComponent,

    // Components
    TaskProgressComponent,
    TickerBarComponent,
    TaskInfoComponent,
    QuestionComponent,
    RangeInputComponent,
    RadioInputComponent,
    SliderInputComponent,
    TimedTestComponent,
    InfoScreenComponent,
    CheckboxInputComponent,
    AudioInputComponent
  ],
  providers: [
    Device,
    StatusBar,
    SplashScreen,
    DatePipe,
    AnswerService,
    ConfigService,
    StorageService,
    KafkaService,
    TimeStampService,
    PrepareDataService,
    Utility,
    LocalNotifications,
    SchedulingService,
    HomeController,
    BarcodeScanner,
    Dialogs,
    Vibration,
    Globalization,
    TranslatePipe,
    AuthService,
    NotificationService,
    AudioRecordService,
    AndroidPermissionUtility,
    AndroidPermissions,
    File,
    AppVersion
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
