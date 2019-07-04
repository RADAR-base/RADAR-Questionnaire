import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import {
  DefaultNotificationRefreshTime,
  DefaultNumberOfCompletionLogsToSend,
  DefaultNumberOfNotificationsToSchedule
} from '../../../../assets/data/defaultConfig'
import { AlertService } from '../../../core/services/alert.service'
import { ConfigService } from '../../../core/services/config.service'
import { FirebaseAnalyticsService } from '../../../core/services/firebaseAnalytics.service'
import { KafkaService } from '../../../core/services/kafka.service'
import { LocalizationService } from '../../../core/services/localization.service'
import { NotificationService } from '../../../core/services/notification.service'
import { SchedulingService } from '../../../core/services/scheduling.service'
import { StorageService } from '../../../core/services/storage.service'
import { LocKeys } from '../../../shared/enums/localisations'
import { StorageKeys } from '../../../shared/enums/storage'
import { TranslatePipe } from '../../../shared/pipes/translate/translate'
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
    private localization: LocalizationService,
    private schedule: SchedulingService,
    private firebaseAnalytics: FirebaseAnalyticsService
  ) {
    this.splashService
      .evalEnrolment()
      .then(valid =>
        valid
          ? this.onStart()
          : this.storage
              .clearStorage()
              .then(() => this.navCtrl.setRoot(EnrolmentPageComponent))
      )
  }

  onStart() {
    this.configService.migrateToLatestVersion()
    return this.configService
      .fetchConfigState(false)
      .then(() => this.checkTimezoneChange())
      .then(() => this.notificationsRefresh())
      .catch(error => {
        console.error(error)
        console.log('[SPLASH] Notifications/config error.')
        this.showConfigError()
      })
      .then(() => {
        this.status = 'Sending missed completion logs...'
        return this.sendNonReportedTaskCompletion()
      })
      .then(() => (this.status = 'Sending cached answers...'))
      .catch(e => console.log('Error sending cache'))
      .then(() => this.navCtrl.setRoot(HomePageComponent))
  }

  checkTimezoneChange() {
    return this.storage.get(StorageKeys.UTC_OFFSET).then(prevUtcOffset => {
      const utcOffset = new Date().getTimezoneOffset()
      // NOTE: Cancels all notifications and reschedule tasks if timezone has changed
      if (prevUtcOffset !== utcOffset) {
        this.status = 'Timezone has changed! Updating schedule...'
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
        if (
          timeElapsed > DefaultNotificationRefreshTime ||
          !lastUpdate ||
          timeElapsed < 0
        ) {
          this.status = 'Updating notifications...'
          console.log('[SPLASH] Scheduling Notifications.')
          return this.notificationService
            .publish()
            .then(() =>
              this.firebaseAnalytics.logEvent('notification_refreshed', {})
            )
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

  sendNonReportedTaskCompletion() {
    const promises = []
    return this.schedule
      .getNonReportedCompletedTasks()
      .then(nonReportedTasks => {
        const length = Math.min(
          nonReportedTasks.length,
          DefaultNumberOfCompletionLogsToSend
        )
        for (let i = 0; i < length; i++) {
          promises.push(
            this.kafka
              .prepareNonReportedTasksKafkaObjectAndSend(nonReportedTasks[i])
              .then(() =>
                this.updateTaskToReportedCompletion(nonReportedTasks[i])
              )
          )
        }
      })
      .then(() => Promise.all(promises))
  }

  updateTaskToReportedCompletion(task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }

  showConfigError() {
    const buttons = [
      {
        text: this.localization.translateKey(LocKeys.BTN_CANCEL),
        handler: () => {}
      },
      {
        text: this.localization.translateKey(LocKeys.BTN_OKAY),
        handler: () => {
          this.onStart()
        }
      }
    ]
    return this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
      message: this.localization.translateKey(LocKeys.CONFIG_ERROR_DESC),
      buttons: buttons
    })
  }
}
