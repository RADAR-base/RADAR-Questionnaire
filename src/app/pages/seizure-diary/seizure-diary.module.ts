import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SeizureDiaryPage } from './seizure-diary';

import { ProtocolService } from '../../core/services/config/protocol.service'
import { TasksService } from '../home/services/tasks.service'
import { QuestionsService } from '../questions/services/questions.service'
import { ScheduleGeneratorService } from '../../core/services/schedule/schedule-generator.service'
import { QuestionnaireService } from '../../core/services/config/questionnaire.service'

import { AlertService } from '../../core/services/misc/alert.service'
import { LocalizationService } from '../../core/services/misc/localization.service'

import { SeizureDiaryService } from './seizure-diary.service'

@NgModule({
  declarations: [
    SeizureDiaryPage,
  ],
  imports: [
    IonicPageModule.forChild(SeizureDiaryPage),
  ],
  providers: [
    ProtocolService,
    TasksService,
    QuestionsService,
    ScheduleGeneratorService,
    QuestionnaireService,
    AlertService,
    LocalizationService,
    SeizureDiaryService,
  ]
})
export class SeizureDiaryModule {}
