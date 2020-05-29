import { Injectable } from '@angular/core'

import { QuestionnaireService } from '../../../core/services/config/questionnaire.service'
import { AssessmentType } from '../../../shared/models/assessment'

@Injectable()
export class OnDemandService {
  constructor(public questionnaire: QuestionnaireService) {}

  getAssessements() {
    return this.questionnaire.getAssessments(AssessmentType.ON_DEMAND)
  }
}
