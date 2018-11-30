import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class ClinicalTasksService {
  constructor(public storage: StorageService) {}

  getClinicalAssessments() {
    return this.storage.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
  }
}
