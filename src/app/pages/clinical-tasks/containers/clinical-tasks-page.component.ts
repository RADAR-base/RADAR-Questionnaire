import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultTask } from '../../../../assets/data/defaultConfig'
import { LocalizationService } from '../../../core/services/localization.service'
import { Task } from '../../../shared/models/task'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { StartPageComponent } from '../../start/containers/start-page.component'
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
    private clinicalTasksService: ClinicalTasksService,
    private localization: LocalizationService
  ) {}

  ionViewDidLoad() {
    this.clinicalTasksService.getClinicalTasks().then(tasks => {
      this.tasks = tasks
    })
  }

  clicked(task) {
    this.clinicalTasksService.getClinicalAssessment(task).then(assessment => {
      const params = {
        title: assessment.name,
        introduction: this.localization.chooseText(assessment.startText),
        endText: this.localization.chooseText(assessment.endText),
        questions: assessment.questions,
        associatedTask: task,
        assessment: assessment
      }
      if (assessment.showIntroduction) {
        this.navCtrl.push(StartPageComponent, params)
      } else {
        this.navCtrl.push(QuestionsPageComponent, params)
      }
    })
  }
}
