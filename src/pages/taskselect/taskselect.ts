import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { StartPage } from '../start/start'

@Component({
  selector: 'page-taskselect',
  templateUrl: 'taskselect.html'
})
export class TaskSelectPage {

  isOpenPageClicked: Boolean = false

  constructor (
    public navCtrl: NavController,
  ) {
  }

  ionViewDidLoad () {
  }

  ionViewDidEnter () {
    
  }

  handleOpenPage () {
    this.isOpenPageClicked = true
    this.openPage()
  }

  handleError (error) {
    console.error(error)
  }

  serviceReady () {
    if (this.isOpenPageClicked) {
      this.openPage()
    }
  }

  openPage () {
    this.navCtrl.push(StartPage)
  }

}
