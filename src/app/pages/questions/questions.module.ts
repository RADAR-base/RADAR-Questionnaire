import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { QuestionModule } from './components/question/question.module'
import { QuestionsPageComponent } from './containers/questions-page.component'
import { AnswerService } from './services/answer.service'
import { AudioRecordService } from './services/audio-record.service'
import { TimestampService } from './services/timestamp.service'

@NgModule({
  imports: [
    CommonModule,
    QuestionModule,
    PipesModule,
    IonicModule.forRoot(QuestionsPageComponent)
  ],
  declarations: [QuestionsPageComponent],
  providers: [AnswerService, AudioRecordService, TimestampService]
})
export class QuestionsModule {}
