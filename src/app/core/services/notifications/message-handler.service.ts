import { Injectable, OnDestroy } from '@angular/core'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { Subscription } from 'rxjs'

import { UsageEventType } from '../../../shared/enums/events'
import { Assessment, AssessmentType } from '../../../shared/models/assessment'
import { MessagingAction } from '../../../shared/models/notification-handler'
import { AppConfigService } from '../config/app-config.service'
import { QuestionnaireService } from '../config/questionnaire.service'
import { LogService } from '../misc/log.service'
import { ScheduleService } from '../schedule/schedule.service'
import { UsageService } from '../usage/usage.service'

@Injectable({
  providedIn: 'root'
})
export class MessageHandlerService implements OnDestroy {
  messageListener: Subscription = new Subscription()

  constructor(
    public logger: LogService,
    public schedule: ScheduleService,
    public questionnaireService: QuestionnaireService,
    public usage: UsageService,
    public appConfig: AppConfigService
  ) {
    FirebaseMessaging.addListener('notificationReceived', event => {
      console.log('notificationReceived', { event })
      this.usage.sendGeneralEvent(UsageEventType.FCM_MESSAGE_RECEIVED)
      return this.onMessageReceived(new Map(Object.entries(event)))
    })
  }

  ngOnDestroy() {
    this.messageListener.unsubscribe()
  }

  onMessageReceived(data: Map<string, string>) {
    const action = data.get('action')
    switch (action) {
      case MessagingAction.QUESTIONNAIRE_TRIGGER:
        this.usage.sendGeneralEvent(
          UsageEventType.QUESTIONNAIRE_TRIGGER_MESSAGE_RECEIVED
        )
        this.logger.log('A questionnaire was triggered!')
        const questionnaire = <Assessment>JSON.parse(data.get('questionnaire'))
        const metadata = new Map<string, string>(
          Object.entries(JSON.parse(data.get('metadata')))
        )
        return this.triggerQuestionnaire(questionnaire)
          .then(() =>
            this.usage.sendQuestionnaireEvent(
              UsageEventType.QUESTIONNAIRE_TRIGGERED,
              questionnaire.name,
              Date.now(),
              metadata
            )
          )
          .catch(e =>
            this.usage.sendGeneralEvent(
              UsageEventType.QUESTIONNAIRE_TRIGGER_ERROR,
              false,
              e.message
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
      this.usage.sendGeneralEvent(
        UsageEventType.QUESTIONNAIRE_TRIGGER_DEFINITION_PULL_SUCCESS
      )
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
