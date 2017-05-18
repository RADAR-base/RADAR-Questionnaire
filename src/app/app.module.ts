import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { BrowserModule } from '@angular/platform-browser'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { IonicApp, IonicModule } from 'ionic-angular'
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';


import { QuestionComponent } from '../components/question/question'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { RangeInputComponent } from '../components/range-input/range-input'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { FinishPage } from '../pages/finish/finish'
import { HomePage } from '../pages/home/home'
import { QuestionsPage } from '../pages/questions/questions'
import { AnswerService } from '../providers/answer-service'
import { QuestionService } from '../providers/question-service'
import { ConfigDataProvider } from '../providers/config-data';
import { MyApp } from './app.component';


// Firebase config setup
export const firebaseConfig = {
  apiKey: "AIzaSyBTEYv6htFpRUXrp5G1cqnAcHT71Ed_lA0",
    authDomain: "radar-armt.firebaseapp.com",
    databaseURL: "https://radar-armt.firebaseio.com",
    projectId: "radar-armt",
    storageBucket: "radar-armt.appspot.com",
    messagingSenderId: "1044012430872"

}

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp, {
      mode: 'md'
    }),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule, // imports firebase/database, only needed for database features
    AngularFireAuthModule // imports firebase/auth, only needed for auth features
    
      ],
  declarations: [
    MyApp,

    // Pages
    HomePage,
    QuestionsPage,
    FinishPage,

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
    QuestionsPage,
    FinishPage,

    // Components
    QuestionComponent,
    RangeInputComponent,
    RadioInputComponent,
    SliderInputComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    QuestionService,
    AnswerService, ConfigDataProvider,AngularFireDatabaseModule
  ]
})
export class AppModule {
}
