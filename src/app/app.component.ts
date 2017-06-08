import { Component } from '@angular/core'
import { SplashScreen } from '@ionic-native/splash-screen'
import { StatusBar } from '@ionic-native/status-bar'
import { Platform } from 'ionic-angular'
import { FirebaseService } from '../providers/firebase-service';
import { StorageService } from '../providers/storage-service'
import { SchedulingService } from '../providers/scheduling-service'
import { HomePage } from '../pages/home/home'


@Component({
  template:
  '<ion-nav [root]="rootPage"></ion-nav>'
})
export class MyApp {
  rootPage = HomePage

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private firebaseService: FirebaseService,
    public storage: StorageService,
    public schedule: SchedulingService
  ) {
    platform.ready().then(() => {
      statusBar.styleDefault()
      splashScreen.hide()
      this.storage.init('12345')
      this.firebaseService.fetchConfigState()
      this.schedule.generateSchedule()
      this.schedule.getTasksForDate(new Date(2019,4,8)).then((tasks) => {
        console.log(tasks)
      })
      this.schedule.getNext().then((task) => {
        console.log(task)
      })
    })
  }
}
