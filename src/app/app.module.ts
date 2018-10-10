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
import { ClinicalTasksPage } from './pages/clinical-tasks/clinical-tasks'
import { EnrolmentPage } from './pages/enrolment/enrolment'
import { AuthService } from './pages/enrolment/services/auth.service'
import { FinishPage } from './pages/finish/finish'
import { PrepareDataService } from './pages/finish/services/preparedata.service'
import { TaskCalendarComponent } from './pages/home/components/task-calendar/task-calendar'
import { TaskInfoComponent } from './pages/home/components/task-info/task-info'
import { TaskProgressComponent } from './pages/home/components/task-progress/task-progress'
import { TickerBarComponent } from './pages/home/components/ticker-bar/ticker-bar'
import { HomePage } from './pages/home/home'
import { InfoScreenComponent } from './pages/questions/components/info-screen/info-screen'
import { AudioInputComponent } from './pages/questions/components/question/audio-input/audio-input'
import { CheckboxInputComponent } from './pages/questions/components/question/checkbox-input/checkbox-input'
import { QuestionComponent } from './pages/questions/components/question/question'
import { RadioInputComponent } from './pages/questions/components/question/radio-input/radio-input'
import { RangeInputComponent } from './pages/questions/components/question/range-input/range-input'
import { SliderInputComponent } from './pages/questions/components/question/slider-input/slider-input'
import { TimedTestComponent } from './pages/questions/components/question/timed-test/timed-test'
import { QuestionsPage } from './pages/questions/questions'
import { AnswerService } from './pages/questions/services/answer.service'
import { AudioRecordService } from './pages/questions/services/audiorecord.service'
import { TimeStampService } from './pages/questions/services/timestamp.service'
import { ReportPage } from './pages/report/report'
import { SettingsPage } from './pages/settings/settings'
import { SplashPage } from './pages/splash/splash'
import { StartPage } from './pages/start/start'
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
    SplashPage,
    EnrolmentPage,
    HomePage,
    ClinicalTasksPage,
    StartPage,
    QuestionsPage,
    FinishPage,
    SettingsPage,
    ReportPage,

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
    SplashPage,
    EnrolmentPage,
    HomePage,
    ClinicalTasksPage,
    StartPage,
    QuestionsPage,
    FinishPage,
    SettingsPage,
    ReportPage,

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
