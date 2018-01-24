import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { TranslatePipe } from '../pipes/translate/translate'
import { LocalNotifications } from '@ionic-native/local-notifications';
import { LocKeys } from '../enums/localisations';

declare var cordova;

@Injectable()
export class NotificationService {

  constructor(private localNotifications: LocalNotifications,
    private translate: TranslatePipe) {
  }

  permissionCheck() {
    (<any>cordova).plugins.notification.local.hasPermission()
    .then((p) => {
      if(!p){
        (<any>cordova).plugins.notification.local.registerPermission()
      }
    })
  }

  setNotifications (tasks) {
      this.localNotifications.clearAll()
      .then(() => {
        for(var i = 0; i < tasks.length; i++) {
          let text = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_1.toString())
          text += tasks[i].estimatedCompletionTime
          text += this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_2.toString());
          (<any>cordova).plugins.notification.local.schedule({
            id: i,
            title: this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW.toString()),
            text: text,
            at: new Date(tasks[i].timestamp),
            led: 'FF0000',
            headsup: true,
            sound: "res://platform_default"
          })
        }
      })
  }

}
