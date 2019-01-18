import { Injectable } from '@angular/core'

import { LocalizationService } from '../../../core/services/localization.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class ClinicalTasksService {
  constructor(
    public storage: StorageService,
    private localization: LocalizationService
  ) {}

  getClinicalAssessment(task) {
    return this.storage.getClinicalAssessment(task)
  }

  getClinicalTasks() {
    return this.storage.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
  }

  getClinicalTaskPayload(task) {
    return this.getClinicalAssessment(task).then(assessment => {
      return {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        associatedTask: task,
        assessment: assessment
      }
    })
  }
}
