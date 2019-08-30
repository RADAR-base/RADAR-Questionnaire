import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from 'ionic-angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { FinishComponent } from './components/finish/finish.component'
import { IntroductionComponent } from './components/introduction/introduction.component'
import { QuestionModule } from './components/question/question.module'
import { ToolbarComponent } from './components/toolbar/toolbar.component'
import { QuestionsPageComponent } from './containers/questions-page.component'
import { AnswerService } from './services/answer.service'
import { AudioRecordService } from './services/audio-record.service'
import { FinishTaskService } from './services/finish-task.service'
import { QuestionsService } from './services/questions.service'
import { TimestampService } from './services/timestamp.service'

const routes: Routes = [
  {
    path: 'questions/:task',
    component: QuestionsPageComponent,
    canActivate: [AuthGuard]
  }
]

@NgModule({
  imports: [
    CommonModule,
    QuestionModule,
    PipesModule,
    IonicModule.forRoot(QuestionsPageComponent),
    RouterModule.forChild(routes)
  ],
  declarations: [
    IntroductionComponent,
    QuestionsPageComponent,
    FinishComponent,
    ToolbarComponent
  ],
  providers: [
    AnswerService,
    AudioRecordService,
    TimestampService,
    QuestionsService,
    FinishTaskService
  ]
})
export class QuestionsModule {}
