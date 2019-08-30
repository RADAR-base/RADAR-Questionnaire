import { Component, OnInit } from '@angular/core'

import { Assessment } from '../../../shared/models/assessment'
import { ClinicalTasksService } from '../services/clinical-tasks.service'

@Component({
  selector: 'page-clinical-tasks',
  templateUrl: 'clinical-tasks-page.component.html'
})
export class ClinicalTasksPageComponent implements OnInit {
  scrollHeight: number = 500
  assessments: Assessment[]

  constructor(private clinicalTasksService: ClinicalTasksService) {}

  ngOnInit() {
    this.clinicalTasksService.getClinicalAssessments().then(assessments => {
      this.assessments = assessments
    })
  }

  clicked(task) {
    // this.navCtrl.push(QuestionsPageComponent, task)
  }
}
