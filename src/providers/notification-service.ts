import { Injectable } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { TranslatePipe } from '../pipes/translate/translate'
import { LocKeys } from '../enums/localisations';
import { Task } from '../models/task'

declare var cordova;

@Injectable()
export class NotificationService {

  constructor(
    private translate: TranslatePipe,
    private alertCtrl: AlertController) {

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
    (<any>cordova).plugins.notification.local.clearAll();
    for(var i = 0; i < tasks.length; i++) {
      if(tasks[i].timestamp > now) {
        let j = (i+1 < tasks.length ? i+1 : i)
        let isLastOfDay = this.evalIsLastOfDay(tasks[i], tasks[j])
          console.log("NOTIFICATION SET " + tasks[i].index + " LastOfDay: " + isLastOfDay)
        let text = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_1.toString())
        text += " " + tasks[i].estimatedCompletionTime + " "
        text += this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_2.toString());
        (<any>cordova).plugins.notification.local.schedule({
          id: tasks[i].index,
          title: this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW.toString()),
          text: text,
          trigger: {at: new Date(tasks[i].timestamp)},
          foreground: true,
          vibrate: true,
          sound: "file://assets/sounds/serious-strike.mp3",
          data: { task: tasks[i], isLastOfDay: isLastOfDay }
        })
      }
    }
    (<any>cordova).plugins.notification.local.on("click", (notification) => this.evalTaskTiming(notification.data))
  }

  evalIsLastOfDay(task1, task2) {
    let date1 = new Date(task1.timestamp)
    let date2 = new Date(task2.timestamp)
    let day1 = date1.getDay()
    let day2 = date2.getDay()
    //TODO needs to be determined better
    let isLastOfDay = false
    return isLastOfDay
  }

  evalTaskTiming(data) {
    let task = data.task
    let scheduledTimestamp = task.timestamp
    let now = new Date().getTime()
    let endScheduledTimestamp = scheduledTimestamp + 1000 * 60 * 10
    if(now > endScheduledTimestamp && task.name == 'ESM'){
      this.showNotificationMissedInfo(task, data.isLastOfDay)
    }
  }

  showNotificationMissedInfo(task:Task, isLastOfDay:boolean) {
    let msgDefault = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_FORGOTTEN_ALERT_DEFAULT_DESC.toString())
    let msgLastOfDay = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_FORGOTTEN_ALERT_LASTOFNIGHT_DESC.toString())
    let msg = isLastOfDay ? msgLastOfDay : msgDefault
    let buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {
        }
      }
    ]
    this.showAlert({
      'title': this.translate.transform(LocKeys.NOTIFICATION_REMINDER_FORGOTTEN.toString()),
      'message': msg,
      'buttons': buttons
    })
  }

  showAlert(parameters) {
    let alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if(parameters.message) {
      alert.setMessage(parameters.message)
    }
    if(parameters.inputs) {
      for(var i=0; i<parameters.inputs.length; i++){
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }

}
