import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { DefaultNotificationRefreshTime } from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/alert.service'
import { ConfigService } from '../../../core/services/config.service'
import { KafkaService } from '../../../core/services/kafka.service'
import { LocalizationService } from '../../../core/services/localization.service'
import { NotificationService } from '../../../core/services/notification.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
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
    private notificationService: NotificationService,
    private kafka: KafkaService,
    private configService: ConfigService,
    private alertService: AlertService,
    private localization: LocalizationService
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
    this.configService.migrateToLatestVersion()
    return this.configService
      .fetchConfigState(false)
      .catch(e => this.showFetchConfigFail(e))
      .then(() => this.checkTimezoneChange())
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

  showFetchConfigFail(e) {
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
      message: e.message,
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_OKAY)
        }
      ]
    })
  }

  checkTimezoneChange() {
    return this.storage.get(StorageKeys.UTC_OFFSET).then(prevUtcOffset => {
      const utcOffset = new Date().getTimezoneOffset()
      // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
      if (prevUtcOffset !== utcOffset) {
        console.log(
          '[SPLASH] Timezone has changed to ' +
            utcOffset +
            '. Cancelling notifications! Rescheduling tasks! Scheduling new notifications!'
        )
        return this.storage
          .set(StorageKeys.UTC_OFFSET, utcOffset)
          .then(() =>
            this.storage.set(StorageKeys.UTC_OFFSET_PREV, prevUtcOffset)
          )
          .then(() => this.configService.updateConfigStateOnTimezoneChange())
      } else {
        console.log('[SPLASH] Current Timezone is ' + utcOffset)
      }
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
          return this.notificationService.publish()
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
