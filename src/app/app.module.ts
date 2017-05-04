import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { BrowserModule } from '@angular/platform-browser'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { IonicApp, IonicModule } from 'ionic-angular'
import { AudioInputComponent } from '../components/audio-input/audio-input'
import { QuestionComponent } from '../components/question/question'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { RangeInputComponent } from '../components/range-input/range-input'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { FinishPage } from '../pages/finish/finish'
import { HomePage } from '../pages/home/home'
import { QuestionsPage } from '../pages/questions/questions'
import { AnswerService } from '../providers/answer-service'
import { QuestionService } from '../providers/question-service'
import { MyApp } from './app.component'

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp, {
      mode: 'md'
    })
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
    SliderInputComponent,
    AudioInputComponent
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
    SliderInputComponent,
    AudioInputComponent
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
