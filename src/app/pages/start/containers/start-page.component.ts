import 'rxjs/add/operator/delay'

import { Component } from '@angular/core'
import { LoadingController, NavController, NavParams } from 'ionic-angular'

import { Assessment } from '../../../shared/models/assessment'
import { Question } from '../../../shared/models/question'
import { Task } from '../../../shared/models/task'
import { QuestionsPageComponent } from '../../questions/containers/questions-page.component'

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

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.associatedTask = this.navParams.data.associatedTask
    this.title = this.navParams.data.title
    this.introduction = this.navParams.data.introduction
    this.questions = this.navParams.data.questions
    this.endText = this.navParams.data.endText
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
