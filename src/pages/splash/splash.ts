import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HomeController } from '../../providers/home-controller';
import { StorageService} from '../../providers/storage-service';
import { HomePage } from '../home/home';
import { EnrolmentPage } from '../enrolment/enrolment';



@Component({
  selector: 'page-splash',
  templateUrl: 'splash.html',
})

export class SplashPage {

  status: string = 'Retrieving storage...'

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private controller: HomeController) {
    this.controller.evalEnrolement()
      .then((evalEnrolement) => {
        this.status = 'Updating notifications...'
        return this.controller.setNextXNotifications(300)
        .then(() => {
          this.status = 'Done'
          if(evalEnrolement){
            this.navCtrl.setRoot(EnrolmentPage)
          } else {
            this.navCtrl.setRoot(HomePage)
          }
        })
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SplashPage');
  }

  setNotifications() {
    try {
      return this.controller.setNextXNotifications(300)
    } catch(e) {
      console.error(e)
      console.log('TEST')
      return Promise.resolve({})
    }
  }

}
