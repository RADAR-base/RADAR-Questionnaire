import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { AnswerService } from '../../providers/answer-service'
import { HomePage } from '../home/home'


@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {

  content: string = ""

  constructor (
    public navCtrl: NavController,
    public navParams: NavParams,
    private controller: HomeController,
    private answerService: AnswerService
  ) {

    }

  ionViewDidLoad () {
    console.log(this.answerService.answers)
    this.content = this.navParams.data.endText
  }

  handleClosePage () {
    this.controller.updateTaskToComplete(this.navParams.data.associatedTask).then(() => {
      this.navCtrl.setRoot(HomePage)
    })
  }
}
