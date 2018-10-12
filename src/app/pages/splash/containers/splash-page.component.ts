import { Component } from '@angular/core'
import { Globalization } from '@ionic-native/globalization'
import { NavController, NavParams } from 'ionic-angular'

import {
  DefaultNotificationRefreshTime,
  DefaultNumberOfNotificationsToSchedule
} from '../../../../assets/data/defaultConfig'
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
  status: string = ''
  forceLocalStorageLookUp: boolean = true
  hasParentPage: boolean = false

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private splashService: SplashService,
    private notificationService: NotificationService,
    private globalization: Globalization,
    private kafka: KafkaService
  ) {
    const parentPage = this.navParams.data.parentPage
    if (parentPage) {
      console.log(`VIEW ${parentPage}`)
      this.hasParentPage = true
    }
    this.status = 'Updating notifications...'
    Promise.all([
      this.storage.get(StorageKeys.TIME_ZONE),
      this.storage.get(StorageKeys.UTC_OFFSET)
    ])
      .then(([timeZone, utcOffset]) => {
        this.globalization
          .getDatePattern({ formatLength: 'short', selector: 'date and time' })
          .then(res => {
            // NOTE: Cancels all notifications if timezone/utc_offset has changed
            // TODO: Force fetch the config and re-schedule here generating a new schedule
            if (timeZone !== res.timezone || utcOffset !== res.utc_offset) {
              console.log(
                '[SPLASH] Timezone has changed to ' +
                  res.timezone +
                  '. Cancelling notifications!'
              )
              this.storage.set(StorageKeys.TIME_ZONE, res.timezone)
              this.storage.set(StorageKeys.UTC_OFFSET, res.utc_offset)
              this.notificationService.cancelNotifications()
            } else {
              console.log('[SPLASH] Current Timezone is ' + timeZone)
            }
          })
      })
      .then(() => {
        console.log('[SPLASH] Scheduling Notifications.')
        // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
        this.storage
          .get(StorageKeys.LAST_NOTIFICATION_UPDATE)
          .then(lastUpdate => {
            const timeElapsed = Date.now() - lastUpdate
            if (timeElapsed > DefaultNotificationRefreshTime || !lastUpdate) {
              this.notificationService
                .setNextXNotifications(DefaultNumberOfNotificationsToSchedule)
                .then(() =>
                  this.storage.set(
                    StorageKeys.LAST_NOTIFICATION_UPDATE,
                    Date.now()
                  )
                )
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
      .then(() => {
        this.status = 'Sending cached answers...'
        return this.kafka.sendAllAnswersInCache()
      })
      .catch(error => {
        console.error(error)
        console.log('[SPLASH] Cache could not be sent.')
      })
      .then(() => {
        this.status = 'Retrieving storage...'

        if (this.hasParentPage) {
          return Promise.resolve(false)
        }
        return this.splashService.evalEnrolment()
      })
      .then(evalEnrolement => {
        if (evalEnrolement) {
          this.navCtrl.setRoot(EnrolmentPageComponent)
        } else {
          let isFirstIonDidViewLoad = true
          if (this.hasParentPage) {
            isFirstIonDidViewLoad = false
          }
          this.navCtrl.setRoot(HomePageComponent, {
            isFirstIonDidViewLoad: isFirstIonDidViewLoad
          })
        }
      })
      .catch(error => {
        console.log('[SPLASH] Error while sending cache.')
        const isFirstIonDidViewLoad = false
        this.navCtrl.setRoot(HomePageComponent, {
          isFirstIonDidViewLoad: isFirstIonDidViewLoad
        })
      })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SplashPage')
  }
}
