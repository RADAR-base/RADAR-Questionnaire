import { Injectable } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'

import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'

@Injectable()
export class MessageHandlerService {
  constructor(
    public firebase: FirebaseX,
    public logger: LogService,
    public schedule: ScheduleService,
    public questionnaire: QuestionnaireService
  ) {
    this.firebase
      .onMessageReceived()
      .subscribe(data => this.onMessageReceived(new Map(Object.entries(data))))
  }

  onMessageReceived(data) {
    const action = data.get('action')
    switch (action) {
      case 'QUESTIONNAIRE_TRIGGER':
        console.log('A questionnaire was triggered!')
        return this.triggerQuestionnaire(JSON.parse(data.get('questionnaire')))
      default:
        console.log('Cannot process message.')
    }
  }

  triggerQuestionnaire(questionnaire: Assessment) {
    return this.questionnaire
      .pullDefinitionForSingleQuestionnaire(questionnaire)
      .then(() =>
        this.schedule.generateSingleTask(
          questionnaire,
          AssessmentType.SCHEDULED,
          Date.now()
        )
      )
  }
}
