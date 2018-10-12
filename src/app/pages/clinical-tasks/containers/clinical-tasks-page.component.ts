import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultTask } from '../../../../assets/data/defaultConfig'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
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
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private clinicalTasksService: ClinicalTasksService
  ) {}

  ionViewDidLoad() {
    this.clinicalTasksService.getClinicalTasks().then(tasks => {
      this.tasks = tasks
    })
  }

  clicked(task) {
    const lang = this.storage.get(StorageKeys.LANGUAGE)
    const nextAssessment = this.clinicalTasksService.getClinicalAssessment(task)
    Promise.all([lang, nextAssessment]).then(res => {
      const language = res[0].value
      const assessment = res[1]
      const params = {
        title: assessment.name,
        introduction: assessment.startText[language],
        endText: assessment.endText[language],
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
