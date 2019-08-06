import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LogService } from '../../../core/services/misc/log.service'
import { ScheduleService } from '../../../core/services/schedule/schedule.service'
import { TaskType } from '../../../shared/utilities/task-type'

@Injectable()
export class ClinicalTasksService {
  constructor(
    public questionnaire: QuestionnaireService,
    private localization: LocalizationService,
    private schedule: ScheduleService,
    private logger: LogService,
  ) {}

  getClinicalTask(assessment) {
    return this.schedule.getClinicalTasks().then(tasks => {
      if (tasks) return tasks.find(t => t.name == assessment.name)
    })
  }

  getClinicalAssessments() {
    return this.questionnaire.getAssessments(TaskType.CLINICAL)
  }

  getClinicalTaskPayload(assessment) {
    return this.getClinicalTask(assessment).then(task => {
      this.logger.log(task)
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        task: task ? task : assessment,
        assessment: assessment
      }
    })
  }
}
