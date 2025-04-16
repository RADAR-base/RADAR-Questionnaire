import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { IonicModule } from '@ionic/angular'

import { PipesModule } from '../../shared/pipes/pipes.module'
import { AuthGuard } from '../auth/services/auth.guard'
import { FinishAndLaunchComponent } from './components/finish-and-launch/finish-and-launch.component'
import { FinishComponent } from './components/finish/finish.component'
import { IntroductionComponent } from './components/introduction/introduction.component'
import { QuestionModule } from './components/question/question.module'
import { ToolbarComponent } from './components/toolbar/toolbar.component'
import { QuestionsPageComponent } from './containers/questions-page.component'
import { AnswerService } from './services/answer.service'
import { AppLauncherService } from './services/app-launcher.service'
import { AudioRecordService } from './services/audio-record.service'
import { QuestionsService } from './services/questions.service'
import { TimestampService } from './services/timestamp.service'
import { DefaultQuestionnaireProcessorService } from './services/questionnaire-processor/default-questionnaire-processor.service'
import { HealthQuestionnaireProcessorService } from './services/questionnaire-processor/health-questionnaire-processor.service'

const routes: Routes = [
  {
    path: '',
    component: QuestionsPageComponent
  }
]

@NgModule({
  imports: [
    CommonModule,
    QuestionModule,
    PipesModule,
    FormsModule,
    IonicModule.forRoot(),
    RouterModule.forChild(routes)
  ],
  declarations: [
    IntroductionComponent,
    QuestionsPageComponent,
    FinishComponent,
    ToolbarComponent,
    FinishAndLaunchComponent
  ],
  providers: [
    AnswerService,
    AudioRecordService,
    TimestampService,
    QuestionsService,
    DefaultQuestionnaireProcessorService,
    HealthQuestionnaireProcessorService,
    AppLauncherService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class QuestionsModule {}
