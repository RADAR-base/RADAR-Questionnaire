import { Injectable } from '@angular/core';
import { NavController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { TranslatePipe } from '../pipes/translate/translate'
import { LocKeys } from '../enums/localisations';

declare var cordova;

@Injectable()
export class NotificationService {

  constructor(
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
    let now = new Date().getTime();
    for(var i = 0; i < tasks.length; i++) {
      if(tasks[i].timestamp > now) {
        console.log("NOTIFICATION SET " + tasks[i].index)
        let text = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_1.toString())
        text += " " + tasks[i].estimatedCompletionTime + " "
        text += this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_2.toString());
        (<any>cordova).plugins.notification.local.schedule({
          id: tasks[i].index,
          title: this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW.toString()),
          text: text,
          at: new Date(tasks[i].timestamp),
          led: 'FF0000',
          headsup: true,
          sound: "res://platform_default",
          data: { task: tasks[i]}
        })
      }
    }
    //(<any>cordova).plugins.notification.local.on("click", (notification) => {console.log("NOTIFICATION NAME: " + notification.data.task.name)})
  }

  returnTaskCallback() {
    return (<any>cordova).plugins.notification.local.on("click", (notification) => {console.log(notification.data.task); return notification.data.task})
  }

}
