import { Component, OnInit } from '@angular/core'
import { NavController } from '@ionic/angular'

import { Assessment } from '../../../shared/models/assessment'
import { ClinicalTasksService } from '../services/clinical-tasks.service'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
import { IonBackButton, IonCol, IonContent, IonHeader, IonRow, IonTitle, IonToolbar } from '@ionic/angular/standalone'

@Component({
  selector: 'app-page-clinical-tasks',
  templateUrl: 'clinical-tasks-page.component.html',
  styleUrls: ['clinical-tasks-page.component.scss'],
  imports: [
    TranslatePipe,
    IonHeader,
    IonToolbar,
    IonBackButton,
    IonTitle,
    IonContent,
    IonRow,
    IonCol
  ]
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
