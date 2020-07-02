import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { AssessmentType } from '../../../shared/models/assessment'

@Injectable()
export class ClinicalTasksService {
  constructor(public questionnaire: QuestionnaireService) {}

  getAssessements() {
    return this.questionnaire.getAssessments(AssessmentType.CLINICAL)
  }
}
