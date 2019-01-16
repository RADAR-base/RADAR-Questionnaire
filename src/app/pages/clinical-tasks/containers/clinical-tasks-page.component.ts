import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultTask } from '../../../../assets/data/defaultConfig'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { Task } from '../../../shared/models/task'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { StartPageComponent } from '../../start/containers/start-page.component'
import { ClinicalTasksService } from '../services/clinical-tasks.service'
import { LocalizationService } from '../../../core/services/localization.service'

@Component({
  selector: 'page-clinical-tasks',
  templateUrl: 'clinical-tasks-page.component.html'
})
export class ClinicalTasksPageComponent {
  scrollHeight: number = 500
  tasks: Task[] = [DefaultTask]

  constructor(
    private navCtrl: NavController,
    private storage: StorageService,
    private clinicalTasksService: ClinicalTasksService,
    private localization: LocalizationService,
  ) {}

  ionViewDidLoad() {
    this.clinicalTasksService.getClinicalTasks()
      .then(tasks => {
        this.tasks = tasks
      })
  }

  clicked(task) {
    this.clinicalTasksService.getClinicalAssessment(task)
      .then(res => {
        const assessment = res[1]
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
