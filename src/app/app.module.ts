import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { MomentModule } from 'angular2-moment'
import { DatePipe } from '@angular/common'
import { BrowserModule } from '@angular/platform-browser'
import { SplashScreen } from '@ionic-native/splash-screen'
import { Device } from '@ionic-native/device'
import { StatusBar } from '@ionic-native/status-bar'
import { IonicApp, IonicModule } from 'ionic-angular'
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { IonicStorageModule } from '@ionic/storage';


import { QuestionComponent } from '../components/question/question'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { RangeInputComponent } from '../components/range-input/range-input'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { FinishPage } from '../pages/finish/finish'
import { HomePage } from '../pages/home/home'
import { SettingsPage } from '../pages/settings/settings'
import { StartPage } from '../pages/start/start'
import { TaskSelectPage } from '../pages/taskselect/taskselect'
import { QuestionsPage } from '../pages/questions/questions'
import { AnswerService } from '../providers/answer-service'
import { QuestionService } from '../providers/question-service'
import { FirebaseService } from '../providers/firebase-service'
import { StorageService } from '../providers/storage-service'
import { FirebaseConfig } from '../assets/data/defaultConfig'
import { KafkaService }  from '../providers/kafka-service'
import { TimeStampService } from '../providers/timestamp-service'
import { PrepareDataService} from '../providers/preparedata-service'
import { Utility } from '../utilities/util'
import { MyApp } from './app.component';


@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    MomentModule,
    IonicModule.forRoot(MyApp, {
      mode: 'md'
    }),
    IonicStorageModule.forRoot({
      name: '__appdb',
      driverOrder: ['sqlite', 'indexeddb', 'websql']
    }),
    AngularFireModule.initializeApp(FirebaseConfig),
    AngularFireDatabaseModule, // imports firebase/database, only needed for database features
    AngularFireAuthModule // imports firebase/auth, only needed for auth features
  ],
  declarations: [
    MyApp,

    // Pages
    HomePage,
    StartPage,
    QuestionsPage,
    FinishPage,
    SettingsPage,
    TaskSelectPage,

    // Components
    QuestionComponent,
    RangeInputComponent,
    RadioInputComponent,
    SliderInputComponent
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,

    // Pages
    HomePage,
    StartPage,
    QuestionsPage,
    FinishPage,
    SettingsPage,
    TaskSelectPage,

    // Components
    QuestionComponent,
    RangeInputComponent,
    RadioInputComponent,
    SliderInputComponent
  ],
  providers: [
    Device,
    StatusBar,
    SplashScreen,
    DatePipe,
    QuestionService,
    AnswerService,
    FirebaseService,
    StorageService,
    AngularFireDatabaseModule,
    KafkaService,
    TimeStampService,
    PrepareDataService,
    Utility
  ]
})
export class AppModule {
}
