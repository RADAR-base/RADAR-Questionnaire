import { Injectable } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'

import { UsageEventType } from '../../../shared/enums/events'
import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { MessagingAction } from '../../../shared/models/notification-handler'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { UsageService } from '../usage/usage.service'

@Injectable()
export class MessageHandlerService {
  constructor(
    public firebase: FirebaseX,
    public logger: LogService,
    public schedule: ScheduleService,
    public questionnaire: QuestionnaireService,
    public usage: UsageService
  ) {
    this.firebase
      .onMessageReceived()
      .subscribe(data => this.onMessageReceived(new Map(Object.entries(data))))
  }

  onMessageReceived(data) {
    const action = data.get('action')
    switch (action) {
      case MessagingAction.QUESTIONNAIRE_TRIGGER:
        this.logger.log('A questionnaire was triggered!')
        const questionnaire = <Assessment>JSON.parse(data.get('questionnaire'))
        const metadata = data.get('metadata')
        return this.triggerQuestionnaire(questionnaire).then(() =>
          this.usage.sendQuestionnaireEvent(
            UsageEventType.QUESTIONNAIRE_TRIGGERED,
            questionnaire.name,
            Date.now(),
            metadata
          )
        )
      default:
        this.logger.log('Cannot process message.')
    }
  }

  triggerQuestionnaire(questionnaire: Assessment) {
    return this.questionnaire
      .pullDefinitionForSingleQuestionnaire(questionnaire)
      .then(() =>
        this.schedule.generateSingleAssessmentTask(
          questionnaire,
          AssessmentType.SCHEDULED,
          Date.now()
        )
      )
  }
}
