import { Component } from '@angular/core'
import { NavController } from 'ionic-angular'
import { TaskSelectPage } from '../taskselect/taskselect'
import { StartPage } from '../start/start'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  isOpenPageClicked: Boolean = false

  // TODO: replace with actual values
  checkmarks = ["1","2","3","4","5"]
  circles = ["6","7","8","9"]
  countCheckmarks = 5
  countTotal = 9

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
    if (this.countTasks() > 1) {
      this.navCtrl.push(TaskSelectPage)
    }
    else {
      this.navCtrl.push(StartPage)
    }
  }

  countTasks() {
    // TODO: identify how many tasks are currently available
    return 3
  }

}
