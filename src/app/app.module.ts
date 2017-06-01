import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { BrowserModule } from '@angular/platform-browser'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { IonicApp, IonicModule } from 'ionic-angular'
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { File } from '@ionic-native/file';

import { QuestionComponent } from '../components/question/question'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { RangeInputComponent } from '../components/range-input/range-input'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { FinishPage } from '../pages/finish/finish'
import { HomePage } from '../pages/home/home'
import { QuestionsPage } from '../pages/questions/questions'
import { AnswerService } from '../providers/answer-service'
import { QuestionService } from '../providers/question-service'
import { FirebaseService } from '../providers/firebase-service';
import { MyApp } from './app.component';


// Firebase config setup
export const firebaseConfig = {
  apiKey: "AIzaSyBFVrRB-XE7nO1qmTXo74RaBeyWf0bWvTU",
    authDomain: "fir-80243.firebaseapp.com",
    databaseURL: "https://fir-80243.firebaseio.com",
    projectId: "fir-80243",
    storageBucket: "fir-80243.appspot.com",
    messagingSenderId: "236588887630"

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
    File,
    AnswerService, 
    FirebaseService,
    AngularFireDatabaseModule
  ]
})
export class AppModule {
}
