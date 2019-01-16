import { Component } from '@angular/core'
import { Globalization } from '@ionic-native/globalization'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultNotificationRefreshTime } from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config.service'
import { KafkaService } from '../../../core/services/kafka.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { SplashService } from '../services/splash.service'
import {IntroPage} from "../../auth/components/welcome-page/intro";
import {WelcomePageComponent} from "../../auth/components/welcome-page/welcome-page.component";
import { NotificationService } from '../../../core/services/notification.service'

@Component({
  selector: 'page-splash',
  templateUrl: 'splash-page.component.html'
})
export class SplashPageComponent {
  status = 'Checking enrolment...'
  forceLocalStorageLookUp = true
  hasParentPage = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private splashService: SplashService,
    private notificationService: NotificationService,
    private globalization: Globalization,
    private kafka: KafkaService,
    private configService: ConfigService
  ) {
    const parentPage = this.navParams.data.parentPage
    if (parentPage) {
      console.log('View', parentPage)
      this.hasParentPage = true
    }

    this.splashService.evalEnrolment().then(participant => {
      if (!participant) {
        this.navCtrl.setRoot(WelcomePageComponent);
      } else {
        this.status = 'Updating notifications...'
        Promise.all([
          this.storage.get(StorageKeys.TIME_ZONE),
          this.storage.get(StorageKeys.UTC_OFFSET)
        ])
          .then(([timeZone, prevUtcOffset]) => {
            return this.globalization
              .getDatePattern({
                formatLength: 'short',
                selector: 'date and time'
              })
              .then(res => {
                const utcOffset = new Date().getTimezoneOffset()
                // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
                if (timeZone !== res.timezone || prevUtcOffset !== utcOffset) {
                  console.log(
                    '[SPLASH] Timezone has changed to ' +
                      res.timezone +
                      '. Cancelling notifications! Rescheduling tasks! Scheduling new notifications!'
                  )
                  return Promise.all([
                    this.storage.set(StorageKeys.TIME_ZONE, res.timezone),
                    this.storage.set(StorageKeys.UTC_OFFSET, utcOffset),
                    this.storage.set(StorageKeys.UTC_OFFSET_PREV, prevUtcOffset),
                  ])
                    .then(() => this.configService.updateConfigStateOnTimezoneChange())
                } else {
                  console.log('[SPLASH] Current Timezone is ' + timeZone)
                }
              })
          })
          .then(() => {
            // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
            this.storage.get(StorageKeys.LAST_NOTIFICATION_UPDATE)
              .then(lastUpdate => {
                const timeElapsed = Date.now() - lastUpdate
                if (
                  timeElapsed > DefaultNotificationRefreshTime ||
                  !lastUpdate
                ) {
                  console.log('[SPLASH] Scheduling Notifications.')
                  return this.notificationService.publish()
                } else {
                  console.log(
                    'Not Scheduling Notifications as ' +
                      timeElapsed +
                      'ms from last refresh is not greater' +
                      'than the default Refresh interval of ' +
                      DefaultNotificationRefreshTime
                  )
                }
              })
          })
          .catch(error => {
            console.error(error)
            console.log('[SPLASH] Notifications error.')
          })
          .then(() => {
            this.status = 'Sending cached answers...'
            return this.kafka.sendAllAnswersInCache()
          })
          .then(() => {
            let isFirstIonDidViewLoad = true
            if (this.hasParentPage) {
              isFirstIonDidViewLoad = false
            }
            this.navCtrl.setRoot(HomePageComponent, {
              isFirstIonDidViewLoad: isFirstIonDidViewLoad
            })
          })
          .catch(error => {
            console.log('[SPLASH] Error while sending cache.')
            const isFirstIonDidViewLoad = false
            this.navCtrl.setRoot(HomePageComponent, {
              isFirstIonDidViewLoad: isFirstIonDidViewLoad
            })
          })
      }
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SplashPage')
  }
}
