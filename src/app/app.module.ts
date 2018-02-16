import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { MomentModule } from 'angular2-moment';
import { DatePipe } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { PipesModule } from '../pipes/pipes.module';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Device } from '@ionic-native/device';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicApp, IonicModule } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Dialogs } from '@ionic-native/dialogs';
import { Vibration } from '@ionic-native/vibration';
import { Globalization } from '@ionic-native/globalization';
import { LocalNotifications } from '@ionic-native/local-notifications';

import { TaskCalendarComponent } from '../components/task-calendar/task-calendar'
import { TaskProgressComponent } from '../components/task-progress/task-progress'
import { TickerBarComponent } from '../components/ticker-bar/ticker-bar'
import { TaskInfoComponent } from '../components/task-info/task-info'
import { QuestionComponent } from '../components/question/question'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { CheckboxInputComponent } from '../components/checkbox-input/checkbox-input'
import { RangeInputComponent } from '../components/range-input/range-input'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { TimedTestComponent } from '../components/timed-test/timed-test'
import { InfoScreenComponent } from '../components/info-screen/info-screen'
import { SplashPage } from '../pages/splash/splash'
import { EnrolmentPage } from '../pages/enrolment/enrolment'
import { FinishPage } from '../pages/finish/finish'
import { HomePage } from '../pages/home/home'
import { SettingsPage } from '../pages/settings/settings'
import { StartPage } from '../pages/start/start'
import { TaskSelectPage } from '../pages/taskselect/taskselect'
import { QuestionsPage } from '../pages/questions/questions'
import { ReportPage } from '../pages/report/report'
import { HomeController } from '../providers/home-controller'
import { AnswerService } from '../providers/answer-service'
import { QuestionService } from '../providers/question-service'
import { ConfigService } from '../providers/config-service'
import { StorageService } from '../providers/storage-service'
import { SchedulingService } from '../providers/scheduling-service'
import { KafkaService }  from '../providers/kafka-service'
import { TimeStampService } from '../providers/timestamp-service'
import { PrepareDataService} from '../providers/preparedata-service'
import { Utility } from '../utilities/util'
import { MyApp } from './app.component';
import { TranslatePipe } from '../pipes/translate/translate';
import { AuthService } from '../providers/auth-service';
import { JwtHelper } from 'angular2-jwt'
import { NotificationService } from '../providers/notification-service';


@NgModule({
  imports: [
    HttpModule,
    HttpClientModule,
    MomentModule,
    BrowserModule,
    RoundProgressModule,
    BrowserAnimationsModule,
    PipesModule,
    IonicModule.forRoot(MyApp, {
      mode: 'md'
    }),
    IonicStorageModule.forRoot({
      name: '__appdb',
      driverOrder: ['sqlite', 'indexeddb', 'websql']
    })
  ],
  declarations: [
    MyApp,

    // Pages
    SplashPage,
    EnrolmentPage,
    HomePage,
    StartPage,
    QuestionsPage,
    FinishPage,
    SettingsPage,
    TaskSelectPage,
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
    CheckboxInputComponent
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,

    // Pages
    SplashPage,
    EnrolmentPage,
    HomePage,
    StartPage,
    QuestionsPage,
    FinishPage,
    SettingsPage,
    TaskSelectPage,
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
    CheckboxInputComponent
  ],
  providers: [
    Device,
    StatusBar,
    SplashScreen,
    DatePipe,
    QuestionService,
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
    JwtHelper,
    NotificationService
  ]
})
export class AppModule {
}
