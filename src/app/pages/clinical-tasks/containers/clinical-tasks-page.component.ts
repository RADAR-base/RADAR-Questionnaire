import { Component, OnInit } from '@angular/core'
import { IonicModule, NavController } from '@ionic/angular'

import { Assessment } from '../../../shared/models/assessment'
import { ClinicalTasksService } from '../services/clinical-tasks.service'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
import { NgForOf } from '@angular/common'

@Component({
  selector: 'page-on-demand',
  templateUrl: 'clinical-tasks-page.component.html',
  styleUrls: ['clinical-tasks-page.component.scss'],
  imports: [IonicModule, TranslatePipe, NgForOf]
})
export class ClinicalTasksPageComponent implements OnInit {
  scrollHeight: number = 500
  assessments: Assessment[]

  constructor(
    public navCtrl: NavController,
    private clinicalTasksService: ClinicalTasksService
  ) {}

  ngOnInit() {
    this.clinicalTasksService.getAssessements().then(assessments => {
      this.assessments = assessments.sort((a, b) => a.order - b.order)
    })
  }

  clicked(task) {
    this.navCtrl.navigateForward('/questions', { state: task })
  }
}
