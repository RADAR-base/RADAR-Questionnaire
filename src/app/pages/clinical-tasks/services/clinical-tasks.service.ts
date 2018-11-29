import { Injectable } from '@angular/core'

import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'

@Injectable()
export class ClinicalTasksService {
  constructor(public storage: StorageService) {}

  getClinicalAssessment(task) {
    return this.storage.getClinicalAssessment(task)
  }

  getClinicalTasks() {
    return this.storage.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
  }

  getClinicalTasksUpdated() {
    const tasks = this.getClinicalTasks()
    const completed = this.getCompletedClinicalTasks()
    return Promise.all([tasks, completed]).then(res => {
      const clinicalAssessments = res[0]
      const completedTasks = res[1]
      if (completedTasks) {
        completedTasks.map(d => {
          const index = clinicalAssessments.findIndex(s => s.name == d.name)
          if (index > -1) {
            clinicalAssessments[index].completed = true
          }
        })
      }
      return clinicalAssessments
    })
  }

  getCompletedClinicalTasks() {
    return this.storage.get(StorageKeys.SCHEDULE_TASKS_COMPLETED)
  }
}
