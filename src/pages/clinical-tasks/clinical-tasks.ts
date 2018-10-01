import { Component } from '@angular/core'
import {
  Content,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular'

import { DefaultTask } from '../../assets/data/defaultConfig'
import { StorageKeys } from '../../enums/storage'
import { Task } from '../../models/task'
import { HomeController } from '../../providers/home-controller'
import { StorageService } from '../../providers/storage-service'
import { QuestionsPage } from '../questions/questions'
import { StartPage } from '../start/start'

@Component({
  selector: 'page-clinical-tasks',
  templateUrl: 'clinical-tasks.html'
})
export class ClinicalTasksPage {
  scrollHeight: number = 500
  tasks: Task[] = [DefaultTask]

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private controller: HomeController
  ) {}

  ionViewDidLoad() {
    this.controller.getClinicalTasks().then(tasks => {
      this.tasks = tasks
    })
  }

  clicked(task) {
    const lang = this.storage.get(StorageKeys.LANGUAGE)
    const nextAssessment = this.controller.getClinicalAssessment(task)
    Promise.all([lang, nextAssessment]).then(res => {
      const language = res[0].value
      const assessment = res[1]
      const params = {
        title: assessment.name,
        introduction: assessment.startText[language],
        endText: assessment.endText[language],
        questions: assessment.questions,
        associatedTask: task
      }
      if (assessment.showIntroduction) {
        this.navCtrl.push(StartPage, params)
      } else {
        this.navCtrl.push(QuestionsPage, params)
      }
      this.controller.updateAssessmentIntroduction(assessment)
    })
  }
}
