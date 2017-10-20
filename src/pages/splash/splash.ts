import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HomeController } from '../../providers/home-controller';
import { HomePage } from '../home/home';
import { EnrolmentPage } from '../enrolment/enrolment';



@Component({
  selector: 'page-splash',
  templateUrl: 'splash.html',
})

export class SplashPage {

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private controller: HomeController) {
    this.controller.evalEnrolement().then((evalEnrolement) => {
      if(evalEnrolement){
        this.navCtrl.setRoot(EnrolmentPage)
      } else {
        this.navCtrl.setRoot(HomePage)
      }
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SplashPage');
  }

}
