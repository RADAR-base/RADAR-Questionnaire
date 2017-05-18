import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { AnswerService } from '../../providers/answer-service'
import { HomePage } from '../home/home'


@Component({
  selector: 'page-finish',
  templateUrl: 'finish.html'
})
export class FinishPage {


  constructor (
    public navCtrl: NavController,
    private answerService: AnswerService
  ) {

    }

  ionViewDidLoad () {
    // TODO: Send data to server
    console.log(this.answerService.answers)
  }

  handleClosePage () {
    this.navCtrl.setRoot(HomePage)
  }

}
