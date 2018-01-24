import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { TranslatePipe } from '../pipes/translate/translate'
import { LocalNotifications } from '@ionic-native/local-notifications';
import { LocKeys } from '../enums/localisations';

/*
  Generated class for the NotificationProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class NotificationService {

  constructor(private localNotifications: LocalNotifications,
    private translate: TranslatePipe) {
  }

  permissionCheck() {
    this.localNotifications.hasPermission()
    .then((p) => {
      if(!p){
        this.localNotifications.registerPermission()
      }
    })
  }

  setNotifications (tasks) {
      this.localNotifications.clearAll()
      .then(() => {
        for(var i = 0; i < tasks.length; i++) {
          let text = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_1.toString())
          text += tasks[i].estimatedCompletionTime
          text += this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_2.toString())
          this.localNotifications.schedule({
            id: i,
            title: this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW.toString()),
            text: text,
            at: new Date(tasks[i].timestamp),
            led: 'FF0000',
            sound: "res://platform_default"
          })
        }
      })
  }

}
