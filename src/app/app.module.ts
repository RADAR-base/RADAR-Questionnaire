import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { QuestionsPage } from '../pages/questions/questions';
import { QuestionComponent } from '../components/question/question';
import { QuestionService } from '../providers/question-service';
import { AnswerService } from '../providers/answer-service';
import { RangeInputComponent } from '../components/range-input/range-input';
import { RadioInputComponent } from '../components/radio-input/radio-input';
import { FinishPage } from '../pages/finish/finish';

@NgModule({
  imports: [
    IonicModule.forRoot(MyApp, {
      mode: "md"
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
    RadioInputComponent
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
    RadioInputComponent
  ],
  providers: [
    QuestionService,
    AnswerService
  ]
})
export class AppModule {}
