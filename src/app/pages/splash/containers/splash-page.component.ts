import { Component } from '@angular/core'
import { NavController, NavParams } from 'ionic-angular'

import { AlertService } from '../../../core/services/misc/alert.service'
import { LocalizationService } from '../../../core/services/misc/localization.service'
import { LocKeys } from '../../../shared/enums/localisations'
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
    private splash: SplashService,
    private alertService: AlertService,
    private localization: LocalizationService
  ) {
    this.splash
      .evalEnrolment()
      .then(() => this.onStart())
      .catch(e => this.enrol())
  }

  onStart() {
    this.status = 'Updating notifications and schedule...'
    return this.splash
      .loadConfig()
      .then(() => this.navCtrl.setRoot(HomePageComponent))
      .catch(e => {
        console.log('[SPLASH] Notifications error.')
        return this.showFetchConfigFail(e)
      })
  }

  showFetchConfigFail(e) {
    this.alertService.showAlert({
      title: this.localization.translateKey(LocKeys.STATUS_FAILURE),
      message: e.message,
      buttons: [
        {
          text: this.localization.translateKey(LocKeys.BTN_RETRY),
          handler: () => {
            this.onStart()
          }
        },
        {
          text: this.localization.translateKey(LocKeys.BTN_RESET),
          handler: () => {
            this.enrol()
          }
        }
      ]
    })
  }

  enrol() {
    this.splash.reset().then(() => this.navCtrl.setRoot(EnrolmentPageComponent))
  }

  // sendNonReportedTaskCompletion() {
  //   const promises = []
  //   return this.schedule
  //     .getNonReportedCompletedTasks()
  //     .then(nonReportedTasks => {
  //       const length = nonReportedTasks.length
  //       for (let i = 0; i < length; i++) {
  //         promises.push(
  //           this.kafka
  //             .prepareNonReportedTasksKafkaObjectAndSend(nonReportedTasks[i])
  //             .then(() =>
  //               this.updateTaskToReportedCompletion(nonReportedTasks[i])
  //             )
  //         )
  //       }
  //     })
  //     .then(() => Promise.all(promises))
  // }

  // updateTaskToReportedCompletion(task): Promise<any> {
  //   const updatedTask = task
  //   updatedTask.reportedCompletion = true
  //   return this.schedule.insertTask(updatedTask)
  // }
}
