import { AnswerService } from './services/answer.service'
import { AudioRecordService } from './services/audio-record.service'
import { CommonModule } from '@angular/common'
import { IntroductionComponent } from './components/introduction/introduction.component'
import { IonicModule } from 'ionic-angular'
import { NgModule } from '@angular/core'
import { PipesModule } from '../../shared/pipes/pipes.module'
import { QuestionModule } from './components/question/question.module'
import { QuestionsPageComponent } from './containers/questions-page.component'
import { QuestionsService } from './services/questions.service'
import { TimestampService } from './services/timestamp.service'

@NgModule({
  imports: [
    CommonModule,
    QuestionModule,
    PipesModule,
    IonicModule.forRoot(QuestionsPageComponent)
  ],
  declarations: [IntroductionComponent, QuestionsPageComponent],
  providers: [
    AnswerService,
    AudioRecordService,
    TimestampService,
    QuestionsService
  ]
})
export class QuestionsModule {}
