import 'rxjs/add/operator/delay'

import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { Assessment } from '../../../shared/models/assessment'
import { Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'
import { StartService } from '../services/start.service'

@Component({
  selector: 'page-start',
  templateUrl: 'start-page.component.html'
})
export class StartPageComponent {
  associatedTask: Task
  introduction: String = ''
  title: String = ''
  questions: Question[]
  endText: String
  assessment: Assessment

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private startService: StartService
  ) {
    this.associatedTask = this.navParams.data.associatedTask
    this.title = this.navParams.data.title
    this.introduction = this.navParams.data.introduction
    this.questions = this.navParams.data.questions
    this.endText = this.navParams.data.endText
    this.assessment = this.navParams.data.assessment
  }

  ionViewDidEnter() {
    this.startService.updateAssessmentIntroduction(this.assessment)
  }

  handleClosePage() {
    this.navCtrl.pop()
  }

  openPage() {
    this.navCtrl.push(QuestionsPageComponent, {
      associatedTask: this.associatedTask,
      questions: this.questions,
      endText: this.endText
    })
  }
}
