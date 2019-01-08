import { Component } from '@angular/core'
import { Globalization } from '@ionic-native/globalization'
import { NavController, NavParams } from 'ionic-angular'

import {
  DefaultNotificationRefreshTime,
  DefaultNumberOfNotificationsToSchedule
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config.service'
import { KafkaService } from '../../../core/services/kafka.service'
import { NotificationService } from '../../../core/services/notification.service'
import { StorageService } from '../../../core/services/storage.service'
import { StorageKeys } from '../../../shared/enums/storage'
import { EnrolmentPageComponent } from '../../auth/containers/enrolment-page.component'
import { HomePageComponent } from '../../home/containers/home-page.component'
import { SplashService } from '../services/splash.service'

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
      console.log(`VIEW ${parentPage}`)
      this.hasParentPage = true
    }

    this.splashService.evalEnrolment().then(participant => {
      if (!participant) {
        this.navCtrl.setRoot(EnrolmentPageComponent)
      } else {
        this.status = 'Updating notifications...'
        Promise.all([
          this.storage.get(StorageKeys.TIME_ZONE),
          this.storage.get(StorageKeys.UTC_OFFSET)
        ])
          .then(([timeZone, utcOffset]) => {
            return this.globalization
              .getDatePattern({
                formatLength: 'short',
                selector: 'date and time'
              })
              .then(res => {
                const offset = new Date().getTimezoneOffset()
                // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
                if (timeZone !== res.timezone || utcOffset !== offset) {
                  console.log(
                    '[SPLASH] Timezone has changed to ' +
                      res.timezone +
                      '. Cancelling notifications! Rescheduling tasks! Scheduling new notifications!'
                  )
                  return this.storage
                    .set(StorageKeys.TIME_ZONE, res.timezone)
                    .then(() =>
                      this.storage.set(StorageKeys.UTC_OFFSET, offset)
                    )
                    .then(() =>
                      this.storage.set(StorageKeys.UTC_OFFSET_PREV, utcOffset)
                    )
                    .then(() =>
                      this.configService.updateConfigStateOnTimezoneChange()
                    )
                } else {
                  console.log('[SPLASH] Current Timezone is ' + timeZone)
                }
              })
          })
          .then(() => {
            // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
            this.storage
              .get(StorageKeys.LAST_NOTIFICATION_UPDATE)
              .then(lastUpdate => {
                const timeElapsed = Date.now() - lastUpdate
                if (
                  timeElapsed > DefaultNotificationRefreshTime ||
                  !lastUpdate
                ) {
                  console.log('[SPLASH] Scheduling Notifications.')
                  return this.configService.rescheduleNotifications()
                } else {
                  console.log(
                    'Not Scheduling Notifications as ' +
                      timeElapsed +
                      'ms from last refresh is not greater than the default Refresh interval of ' +
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
            this.status = 'Retrieving storage...'

            if (this.hasParentPage) {
              return Promise.resolve(false)
            }
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
