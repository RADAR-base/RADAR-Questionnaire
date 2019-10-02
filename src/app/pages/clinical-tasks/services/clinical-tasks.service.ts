import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { TaskType } from '../../../shared/utilities/task-type'

@Injectable()
export class ClinicalTasksService {
  constructor(public questionnaire: QuestionnaireService) {}

  getClinicalAssessments() {
    return this.questionnaire.getAssessments(TaskType.CLINICAL)
  }
}
