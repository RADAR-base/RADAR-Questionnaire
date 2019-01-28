import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'

import { DefaultTask } from '../../../../assets/data/defaultConfig'
import { Task } from '../../../shared/models/task'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { ClinicalTasksService } from '../services/clinical-tasks.service'

@Component({
  selector: 'page-clinical-tasks',
  templateUrl: 'clinical-tasks-page.component.html'
})
export class ClinicalTasksPageComponent {
  scrollHeight: number = 500
  tasks: Task[] = [DefaultTask]

  constructor(
    private navCtrl: NavController,
    private clinicalTasksService: ClinicalTasksService
  ) {}

  ionViewDidLoad() {
    this.clinicalTasksService.getClinicalTasks().then(tasks => {
      this.tasks = tasks
    })
  }

  clicked(task) {
    this.clinicalTasksService
      .getClinicalTaskPayload(task)
      .then(payload => this.navCtrl.push(QuestionsPageComponent, payload))
  }
}
