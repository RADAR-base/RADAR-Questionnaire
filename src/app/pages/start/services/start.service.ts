import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'

@Injectable()
export class StartService {
  constructor(public storage: StorageService) {}

  updateAssessmentIntroduction(assessment) {
    if (assessment.showIntroduction) {
      const assessmentUpdated = assessment
      assessmentUpdated.showIntroduction = false
      this.storage.updateAssessment(assessmentUpdated)
    }
  }
}
