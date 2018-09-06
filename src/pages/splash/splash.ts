import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HomeController } from '../../providers/home-controller';
import { StorageService} from '../../providers/storage-service';
import { KafkaService } from '../../providers/kafka-service';
import { StorageKeys } from '../../enums/storage';
import { HomePage } from '../home/home';
import { EnrolmentPage } from '../enrolment/enrolment';
import { DefaultNumberOfNotificationsToSchedule, DefaultNotificationRefreshTime } from '../../assets/data/defaultConfig';
import { Globalization} from '@ionic-native/globalization';


@Component({
  selector: 'page-splash',
  templateUrl: 'splash.html',
})

export class SplashPage {

  status: string = ''
  forceLocalStorageLookUp: boolean = true
  hasParentPage: boolean = false

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private controller: HomeController,
    private globalization: Globalization,
    private kafka: KafkaService) {
    const parentPage = this.navParams.data.parentPage
    if(parentPage){
      console.log(`VIEW ${parentPage}`)
      this.hasParentPage = true
    }
    this.status = 'Updating notifications...'
    Promise.all([this.storage.get(StorageKeys.TIME_ZONE),
      this.storage.get(StorageKeys.UTC_OFFSET)])
    .then(([timeZone, utcOffset]) => {
      this.globalization.getDatePattern( { formatLength: 'short', selector: 'date and time'} )
      .then((res) => {
        // cancel all notifications if timezone/utc_offset has changed
        if(timeZone != res.timezone || utcOffset != res.utc_offset)
        {
          console.log('[SPLASH] Timezone has changed to '+ res.timezone + '. Cancelling notifications!')
          this.storage.set(StorageKeys.TIME_ZONE, res.timezone)
          this.storage.set(StorageKeys.UTC_OFFSET, res.utc_offset)
          this.controller.cancelNotifications()
        }
        else {
          console.log('[SPLASH] Current Timezone is ' + timeZone)
        }
      }
    )})
    .then(() => {
      console.log('[SPLASH] Scheduling Notifications.')
      //Only run this if not run in last DefaultNotificationRefreshTime
      this.storage.get(StorageKeys.LAST_NOTIFICATION_UPDATE)
      .then((lastUpdate) => {
        var timeElapsed = Date.now() - lastUpdate
        if((timeElapsed > DefaultNotificationRefreshTime) || !lastUpdate)  {
          this.controller.setNextXNotifications(DefaultNumberOfNotificationsToSchedule)
            .then(() => this.storage.set(StorageKeys.LAST_NOTIFICATION_UPDATE, Date.now()))
        } else {
          console.log('Not Scheduling Notifications as ' + timeElapsed
          + 'ms from last refresh is not greater' +
          'than the default Refresh interval of ' + DefaultNumberOfNotificationsToSchedule)
        }
      })
    })
    .then(() => {
      this.status = 'Sending cached answers...'
      return this.kafka.sendAllAnswersInCache()
    })
    .catch((error) => {
      console.error(error)
      console.log('[SPLASH] Cache could not be sent.')
    })
    .then(() => {
      this.status = 'Retrieving storage...'

      if(this.hasParentPage) {
        return Promise.resolve(false)
      }
      return this.controller.evalEnrolment()
    })
    .then((evalEnrolement) => {
      if(evalEnrolement){
        this.navCtrl.setRoot(EnrolmentPage)
      } else {
        let isFirstIonDidViewLoad = true
        if(this.hasParentPage){
          isFirstIonDidViewLoad = false
        }
        this.navCtrl.setRoot(HomePage, {'isFirstIonDidViewLoad': isFirstIonDidViewLoad})
      }
    })
    .catch((error) => {
      console.log('[SPLASH] Error while sending cache.')
      let isFirstIonDidViewLoad = false
      this.navCtrl.setRoot(HomePage, {'isFirstIonDidViewLoad': isFirstIonDidViewLoad})
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SplashPage');
  }

}
