import { Injectable } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { TranslatePipe } from '../pipes/translate/translate'
import { LocKeys } from '../enums/localisations';
import { Task } from '../models/task'
import { SchedulingService } from '../providers/scheduling-service';
import { DefaultNumberOfNotificationsToSchedule } from '../assets/data/defaultConfig';

declare var cordova;

@Injectable()
export class NotificationService {

  constructor(
    private translate: TranslatePipe,
    private alertCtrl: AlertController,
    private schedule: SchedulingService ) {
  }

  permissionCheck() {
    (<any>cordova).plugins.notification.local.hasPermission()
    .then((p) => {
      if(!p){
        (<any>cordova).plugins.notification.local.registerPermission()
      }
    })
  }

  generateNotificationSubsetForXTasks(noOfNotifications) {
    let today = new Date().getTime()
    var promises = []
    return this.schedule.getTasks()
    .then((tasks) => {
      let limitedTasks = {}
      for(var i = 0; i < tasks.length; i++) {
        if(tasks[i].timestamp > today){
          const key = `${tasks[i].timestamp}-${tasks[i].name}`
          limitedTasks[key] = tasks[i]
        }
      }
      const ltdTasksIdx = Object.keys(limitedTasks)
      ltdTasksIdx.sort()

      let noOfLtdNotifications = noOfNotifications
      if(noOfNotifications >= ltdTasksIdx.length) {
        noOfLtdNotifications = ltdTasksIdx.length
      }

      let desiredSubset = []
      for(var i = 0; i < noOfLtdNotifications; i++) {
        desiredSubset.push(limitedTasks[ltdTasksIdx[i]])
      }
      return desiredSubset
    })
  }

  setNotifications (tasks) {
    let now = new Date().getTime();
    let notifications = []
    for(var i = 0; i < tasks.length; i++) {
      if(tasks[i].timestamp > now) {
        let j = (i+1 < tasks.length ? i+1 : i)
        let isLastScheduledNotification = i+1 == tasks.length ? true : false
        let isLastOfDay = this.evalIsLastOfDay(tasks[i], tasks[j])
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
          data: {
            task: tasks[i],
            isLastOfDay: isLastOfDay,
            isLastScheduledNotification: isLastScheduledNotification
          }
        })
      }
    }
    console.log('NOTIFICATIONS Scheduleing notification');
    (<any>cordova).plugins.notification.local.on("click", (notification) => this.evalTaskTiming(notification.data));
    (<any>cordova).plugins.notification.local.on("trigger", (notification) => this.evalLastTask(notification.data));
    return (<any>cordova).plugins.notification.local.schedule(notifications, () => {return Promise.resolve({})});
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
    (<any>cordova).plugins.notification.local.clearAll()
  }

  evalLastTask(data) {
    if(data.isLastScheduledNotification) {
      this.generateNotificationSubsetForXTasks(DefaultNumberOfNotificationsToSchedule)
      .then((desiredSubset) => {
        console.log("NOTIFICATION RESCHEDULE")
        this.setNotifications(desiredSubset)
      })
    }
  }

  consoleLogScheduledNotifications () {
    (<any>cordova).plugins.notification.local.getScheduled(
      (notifications) => {
      console.log(`\nNOTIFICATIONS NUMBER ${notifications.length}\n`)
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
      (<any>cordova).plugins.notification.local.cancelAll(() => {
        this.evalLastTask({'isLastScheduledNotification': true})
      });
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
