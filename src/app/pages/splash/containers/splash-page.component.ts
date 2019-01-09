import { Component } from '@angular/core'
import { Globalization } from '@ionic-native/globalization'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultNotificationRefreshTime } from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config.service'
import { KafkaService } from '../../../core/services/kafka.service'
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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public storage: StorageService,
    private splashService: SplashService,
    private globalization: Globalization,
    private kafka: KafkaService,
    private configService: ConfigService
  ) {
    this.splashService
      .evalEnrolment()
      .then(
        participant =>
          participant
            ? this.onStart()
            : this.navCtrl.setRoot(EnrolmentPageComponent)
      )
  }

  onStart() {
    this.status = 'Updating notifications...'
    return this.checkTimezoneChange()
      .then(() => this.notificationsRefresh())
      .catch(error => {
        console.error(error)
        console.log('[SPLASH] Notifications error.')
      })
      .then(() => {
        this.status = 'Sending cached answers...'
        return this.kafka.sendAllAnswersInCache()
      })
      .catch(e => console.log('Error sending cache'))
      .then(() => this.navCtrl.setRoot(HomePageComponent))
  }

  checkTimezoneChange() {
    return Promise.all([
      this.storage.get(StorageKeys.TIME_ZONE),
      this.storage.get(StorageKeys.UTC_OFFSET)
    ]).then(([timezone, prevUtcOffset]) => {
      return this.globalization
        .getDatePattern({
          formatLength: 'short',
          selector: 'date and time'
        })
        .then(res => {
          const utcOffset = new Date().getTimezoneOffset()
          // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
          if (timezone !== res.timezone || prevUtcOffset !== utcOffset) {
            console.log(
              '[SPLASH] Timezone has changed to ' +
                res.timezone +
                '. Cancelling notifications! Rescheduling tasks! Scheduling new notifications!'
            )
            return Promise.all([
              this.storage.set(StorageKeys.TIME_ZONE, res.timezone),
              this.storage.set(StorageKeys.UTC_OFFSET, utcOffset),
              this.storage.set(StorageKeys.UTC_OFFSET_PREV, prevUtcOffset)
            ]).then(() =>
              this.configService.updateConfigStateOnTimezoneChange()
            )
          } else {
            console.log('[SPLASH] Current Timezone is ' + timezone)
          }
        })
    })
  }

  notificationsRefresh() {
    // NOTE: Only run this if not run in last DefaultNotificationRefreshTime
    return this.storage
      .get(StorageKeys.LAST_NOTIFICATION_UPDATE)
      .then(lastUpdate => {
        const timeElapsed = Date.now() - lastUpdate
        if (timeElapsed > DefaultNotificationRefreshTime || !lastUpdate) {
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
  }
}
