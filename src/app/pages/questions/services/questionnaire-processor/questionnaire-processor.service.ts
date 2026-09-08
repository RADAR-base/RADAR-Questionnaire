import { Injectable } from '@angular/core'

import { KafkaService } from '../../../../core/services/kafka/kafka.service'
import { ScheduleService } from '../../../../core/services/schedule/schedule.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { NotificationService } from '../../../../core/services/notifications/notification.service'
import { NotificationActionType } from 'src/app/shared/models/notification-handler'
import { ProtocolEventMetaData } from 'src/app/shared/models/protocol'
import { TemplateRendererService } from 'src/app/core/services/misc/template-renderer.service'

@Injectable({
  providedIn: 'root'
})
export abstract class QuestionnaireProcessorService {
  constructor(
    protected schedule: ScheduleService,
    public kafka: KafkaService,
    protected notifications: NotificationService,
    protected templateRenderer: TemplateRendererService
  ) { }

  process(data, task, assessmentMetadata, protocolMetaData?: ProtocolEventMetaData) { }

  protected async addAssessmentDisplayNameToMetadata(
    task,
    assessmentMetadata,
    protocolMetaData?: ProtocolEventMetaData
  ) {
    if (!assessmentMetadata) return assessmentMetadata
    const computedEventName = await this.templateRenderer.renderProtocolDisplayName(
      task,
      assessmentMetadata,
      protocolMetaData
    )
    if (!computedEventName) return assessmentMetadata
    return Object.assign({}, assessmentMetadata, {
      computedEventName
    })
  }

  updateTaskToComplete(task): Promise<any> {
    return Promise.all([
      this.schedule
        .updateTaskToComplete(task)
        .then(res => this.schedule.updateTaskToReportedCompletion(task))
        .then(res => this.cancelRemindersForTask(task)),
      task.type == AssessmentType.SCHEDULED || task.type == AssessmentType.TRIGGERED
        ? this.schedule.addToCompletedTasks(task)
        : Promise.resolve()
    ])
  }

  cancelRemindersForTask(task): Promise<any> {
    console.log('cancelRemindersForTask', task)
    const notifications = task.notifications
    return Promise.all(notifications.map(n => {
      if (n.id) {
        return this.notifications.publish(NotificationActionType.CANCEL_SINGLE, 0, n.id)
          .then(() => n.id = undefined)
      } else return
    }))
  }
}
