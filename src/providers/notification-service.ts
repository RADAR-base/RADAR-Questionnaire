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
    console.log('NOTIFICATIONS ClearAll')
    let now = new Date().getTime();
    return (<any>cordova).plugins.notification.local.cancelAll(() => {
      let notifications = []
      for(var i = 0; i < tasks.length; i++) {
        if(tasks[i].timestamp > now) {
          let j = (i+1 < tasks.length ? i+1 : i)
          let isLastOfDay = this.evalIsLastOfDay(tasks[i], tasks[j])
            //console.log("NOTIFICATIONS SET " + tasks[i].index + " LastOfDay: " + isLastOfDay)
          let text = this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_1.toString())
          text += " " + tasks[i].estimatedCompletionTime + " "
          text += this.translate.transform(LocKeys.NOTIFICATION_REMINDER_NOW_DESC_2.toString());
          notifications.push({
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
      console.log('NOTIFICATIONS Scheduleing notifications');
      (<any>cordova).plugins.notification.local.on("click", (notification) => this.evalTaskTiming(notification.data));
      return (<any>cordova).plugins.notification.local.schedule(notifications, () => {return Promise.resolve({})});
    });
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

  cancelOverdueNotifications (){
    (<any>cordova).plugins.notification.local.getIds()
    .then(ids => {
      console.log(ids)
      const now = new Date().getTime()
      ids.map(id => {
        if(id < now) {
          (<any>cordova).plugins.notification.local.cancel(id)
        }
      })
    })
  }

  consoleLogScheduledNotifications () {
    (<any>cordova).plugins.notification.local.getScheduled(
      (notifications) => {
      let dailyNotifies = {}
      for(var i = 0; i<notifications.length; i++){
        const data = JSON.parse(notifications[i]['data'])
        const trigger = new Date(notifications[i]['trigger']['at']).toString()
        const key = trigger.substr(4,11)
        const name = data['task']['name']
        const id = notifications[i].id
        const rendered = `${i} ID ${id} TIME ${trigger.substr(15)} NAME ${name}\n`

        let tmp = dailyNotifies[key]
        if(tmp == undefined) {
          dailyNotifies[key] = `\nNOTIFICATIONS DATE ${key}\n` + rendered
        } else {
          dailyNotifies[key] += rendered
        }
      }
      const keys = Object.keys(dailyNotifies)
      keys.sort()
      console.log(`\n NOTIFICATIONS Scheduled Notifications (${notifications.length}):\n`)
      for(var i = 0; i<keys.length; i++){
        console.log(dailyNotifies[keys[i]])
      }

    });
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
