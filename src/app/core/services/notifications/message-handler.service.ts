import { Injectable, OnDestroy } from '@angular/core'
import { FirebaseX } from '@ionic-native/firebase-x/ngx'
import { Subscription } from 'rxjs'

import { UsageEventType } from '../../../shared/enums/events'
import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { MessagingAction } from '../../../shared/models/notification-handler'
import { AppConfigService } from '../config/app-config.service'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { UsageService } from '../usage/usage.service'

@Injectable()
export class MessageHandlerService implements OnDestroy {
  messageListener: Subscription = new Subscription()

  constructor(
    public firebase: FirebaseX,
    public logger: LogService,
    public schedule: ScheduleService,
    public questionnaireService: QuestionnaireService,
    public usage: UsageService,
    public appConfig: AppConfigService
  ) {
    this.messageListener = this.firebase
      .onMessageReceived()
      .subscribe(data => this.onMessageReceived(new Map(Object.entries(data))))
  }

  ngOnDestroy() {
    this.messageListener.unsubscribe()
  }

  onMessageReceived(data: Map<string, string>) {
    const action = data.get('action')
    switch (action) {
      case MessagingAction.QUESTIONNAIRE_TRIGGER:
        this.logger.log('A questionnaire was triggered!')
        const questionnaire = <Assessment>JSON.parse(data.get('questionnaire'))
        const metadata = new Map<string, string>(
          Object.entries(JSON.parse(data.get('metadata')))
        )
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
    return Promise.all([
      this.appConfig.getReferenceDate(),
      this.questionnaireService.pullDefinitionForSingleQuestionnaire(
        questionnaire
      )
    ]).then(([refTimestamp, questionnaireWithDef]) => {
      return this.questionnaireService
        .addToAssessments(AssessmentType.SCHEDULED, questionnaireWithDef)
        .then(() =>
          this.schedule.generateSingleAssessmentTask(
            questionnaireWithDef,
            AssessmentType.SCHEDULED,
            refTimestamp
          )
        )
    })
  }
}
