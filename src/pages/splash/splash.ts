import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HomeController } from '../../providers/home-controller';
import { StorageService} from '../../providers/storage-service';
import { KafkaService } from '../../providers/kafka-service';
import { HomePage } from '../home/home';
import { EnrolmentPage } from '../enrolment/enrolment';



@Component({
  selector: 'page-splash',
  templateUrl: 'splash.html',
})

export class SplashPage {

  status: string = ''
  forceLocalStorageLookUp: boolean = true

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private controller: HomeController,

    private kafka: KafkaService) {
    const parentPage = this.navParams.data.parentPage
    if(parentPage){
      this.forceLocalStorageLookUp = false
    }
    this.status = 'Updating notifications...'
    this.controller.setNextXNotifications(100)
    .then(() => {
      this.status = 'Sending cached answers...'
      return this.kafka.sendAllAnswersInCache()
    })
    .then(() => {
      this.status = 'Retrieving storage...'
      return this.controller.evalEnrolment(this.forceLocalStorageLookUp)
    })
    .then((evalEnrolement) => {
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
