import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { MomentModule } from 'angular2-moment'
import { BrowserModule } from '@angular/platform-browser'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { IonicStorageModule } from '@ionic/storage'
import { IonicApp, IonicModule } from 'ionic-angular'
import { QuestionComponent } from '../components/question/question'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { RangeInputComponent } from '../components/range-input/range-input'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { FinishPage } from '../pages/finish/finish'
import { HomePage } from '../pages/home/home'
import { SettingsPage } from '../pages/settings/settings'
import { QuestionsPage } from '../pages/questions/questions'
import { AnswerService } from '../providers/answer-service'
import { QuestionService } from '../providers/question-service'
import { MyApp } from './app.component'

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
         driverOrder: ['sqlite','indexeddb', 'websql']
    })
  ],
  declarations: [
    MyApp,

    // Pages
    HomePage,
    QuestionsPage,
    FinishPage,
    SettingsPage,

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
    SettingsPage,

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
    AnswerService
  ]
})
export class AppModule {
}
