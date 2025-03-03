import { Component, OnInit } from '@angular/core'
import { IonicModule, NavController } from '@ionic/angular'

import { Assessment } from '../../../shared/models/assessment'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { OnDemandService } from '../services/on-demand.service'
import { AsyncPipe, NgForOf } from '@angular/common'

@Component({
  selector: 'page-on-demand',
  templateUrl: 'on-demand-page.component.html',
  styleUrls: ['on-demand-page.component.scss'],
  imports: [IonicModule, AsyncPipe, NgForOf]
})
export class OnDemandPageComponent implements OnInit {
  scrollHeight: number = 500
  assessments: Assessment[]
  title: Promise<String>

  constructor(
    public navCtrl: NavController,
    private onDemandService: OnDemandService
  ) {}

  ngOnInit() {
    this.onDemandService.getAssessements().then(assessments => {
      this.assessments = assessments.sort((a, b) => a.order - b.order)
    })
    this.title = this.onDemandService.getOnDemandPageLabel()
  }

  clicked(task) {
    this.navCtrl.navigateForward('/questions', { state: task })
  }
}
