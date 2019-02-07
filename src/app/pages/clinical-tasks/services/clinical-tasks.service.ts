import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { TaskType } from '../../../shared/utilities/task-type'

@Injectable()
export class ClinicalTasksService {
  constructor(
    public questionnaire: QuestionnaireService,
    private localization: LocalizationService
  ) {}

  getClinicalAssessment(task) {
    return this.questionnaire.getAssessment(TaskType.CLINICAL, task)
  }

  getClinicalTasks() {
    return this.questionnaire.getAssessments(TaskType.CLINICAL)
  }

  getClinicalTaskPayload(task) {
    return this.getClinicalAssessment(task).then(assessment => {
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        task: task,
        assessment: assessment
      }
    })
  }
}
