import { Component } from '@angular/core';
import { Content, NavController, NavParams, ViewController } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { Task } from '../../models/task'
import { DefaultTask } from '../../assets/data/defaultConfig'
import { StorageService } from '../../providers/storage-service'
import { StorageKeys } from '../../enums/storage'
import { StartPage } from '../start/start'
import { QuestionsPage } from '../questions/questions'

@Component({
  selector: 'page-clinical-tasks',
  templateUrl: 'clinical-tasks.html',
})
export class ClinicalTasksPage {

  scrollHeight: number = 500
  tasks: Task[] = [DefaultTask]

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private storage:StorageService, private controller: HomeController) {
  }

  ionViewDidLoad() {
    this.controller.getClinicalTasks()
    .then((tasks) => {
      this.tasks = tasks
    })
  }

  clicked (task) {
    let lang = this.storage.get(StorageKeys.LANGUAGE)
    let nextAssessment = this.controller.getClinicalAssessment(task)
    Promise.all([lang, nextAssessment])
    .then((res) => {
      let lang = res[0]
      let assessment = res[1]
      console.log(assessment)
      let params = {
        "title": assessment.name,
        "introduction": assessment.startText[lang.value],
        "endText": assessment.endText[lang.value],
        "questions": assessment.questions,
        "associatedTask": task
      }
      if(assessment.showIntroduction){
        this.navCtrl.push(StartPage, params)
      } else {
        this.navCtrl.push(QuestionsPage, params)
      }
      this.controller.updateAssessmentIntroduction(assessment)
    })
  }

}
