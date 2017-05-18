import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'
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
    private answerService: AnswerService
  ) {

    }

  ionViewDidLoad () {
    // TODO: Send data to server
    console.log(this.answerService.answers)
    // resolve observable with async properly
    this.content = this.navParams.data.endText
  }

  handleClosePage () {
    this.navCtrl.setRoot(HomePage)
  }

}
