import { NgModule } from '@angular/core'
import { IonicApp, IonicModule } from 'ionic-angular'
import { MyApp } from './app.component'
import { HomePage } from '../pages/home/home'
import { QuestionsPage } from '../pages/questions/questions'
import { QuestionComponent } from '../components/question/question'
import { QuestionService } from '../providers/question-service'
import { AnswerService } from '../providers/answer-service'
import { RangeInputComponent } from '../components/range-input/range-input'
import { RadioInputComponent } from '../components/radio-input/radio-input'
import { FinishPage } from '../pages/finish/finish'
import { SliderInputComponent } from '../components/slider-input/slider-input'
import { AudioInputComponent } from '../components/audio-input/audio-input'	//added audio-input component

@NgModule({
  imports: [
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
    QuestionService,
    AnswerService
  ]
})
export class AppModule {
  
}
