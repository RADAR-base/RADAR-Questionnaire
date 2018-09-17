import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { StartPage } from '../start/start'

@Component({
  selector: 'page-taskselect',
  templateUrl: 'taskselect.html'
})
export class TaskSelectPage {
  isOpenPageClicked: Boolean = false

  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {}

  ionViewDidEnter() {}

  handleOpenPage(assessmentIndex) {
    this.isOpenPageClicked = true
    this.openPage(assessmentIndex)
  }

  handleError(error) {
    console.error(error)
  }

  serviceReady() {
    if (this.isOpenPageClicked) {
      this.openPage(0)
    }
  }

  openPage(assessmentIndex) {
    this.navCtrl.push(StartPage, { assessmentIndex: assessmentIndex })
  }
}
