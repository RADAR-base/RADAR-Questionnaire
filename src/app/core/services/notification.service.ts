import 'rxjs/add/operator/map'

import { Injectable } from '@angular/core'
import { v4 as uuid } from 'uuid'

import {
  DefaultMaxUpstreamResends,
  DefaultNotificationType,
  DefaultNumberOfNotificationsToRescue,
  DefaultNumberOfNotificationsToSchedule,
  DefaultTaskTest,
  FCMPluginProjectSenderId
} from '../../../assets/data/defaultConfig'
import { LocKeys } from '../../shared/enums/localisations'
import { StorageKeys } from '../../shared/enums/storage'
import { Task } from '../../shared/models/task'
import { TranslatePipe } from '../../shared/pipes/translate/translate'
import { getMilliseconds, getSeconds } from '../../shared/utilities/time'
import { AlertService } from './alert.service'
import { SchedulingService } from './scheduling.service'
import { StorageService } from './storage.service'

declare var FirebasePlugin

@Injectable()
export class NotificationService {
  upstreamResendAttempts: number

  constructor(
    private translate: TranslatePipe,
    private alertService: AlertService,
    private schedule: SchedulingService,
    public storage: StorageService
  ) {}

  init() {
    try {
      FirebasePlugin.setSenderId(
        FCMPluginProjectSenderId,
        function() {
          console.log('[NOTIFICATION SERVICE] Set sender id success')
        },
        function(error) {
          console.log(error)
          alert(error)
        }
      )

      FirebasePlugin.getToken(function(token) {
        console.log('[NOTIFICATION SERVICE] Refresh token success')
      })
    } catch (error) {
      console.error(error)
    }
  }

  permissionCheck() {
    ;(<any>cordova).plugins.notification.local.hasPermission().then(p => {
      if (!p) {
        ;(<any>cordova).plugins.notification.local.registerPermission()
      }
    })
  }

  generateNotificationSubsetForXTasks(noOfNotifications) {
    const today = new Date().getTime()
    const promises = []
    return this.schedule.getTasks().then(tasks => {
      const limitedTasks = {}
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].timestamp > today) {
          const key = `${tasks[i].timestamp}-${tasks[i].name}`
          limitedTasks[key] = tasks[i]
        }
      }
      const ltdTasksIdx = Object.keys(limitedTasks)
      ltdTasksIdx.sort()

      let noOfLtdNotifications = noOfNotifications
      if (noOfNotifications >= ltdTasksIdx.length) {
        noOfLtdNotifications = ltdTasksIdx.length
      }

      const desiredSubset = []
      for (let i = 0; i < noOfLtdNotifications; i++) {
        desiredSubset.push(limitedTasks[ltdTasksIdx[i]])
      }
      return desiredSubset
    })
  }

  setNotifications(tasks) {
    return this.storage
      .get(StorageKeys.PARTICIPANTLOGIN)
      .then(participantLogin => {
        if (participantLogin) {
          const now = new Date().getTime()
          const localNotifications = []
          const fcmNotifications = []
          for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].timestamp > now) {
              const j = i + 1 < tasks.length ? i + 1 : i
              const isLastScheduledNotification = i + 1 === tasks.length
              const isLastOfDay = this.evalIsLastOfDay(tasks[i], tasks[j])
              const localNotification = this.formatLocalNotification(
                tasks[i],
                isLastScheduledNotification,
                isLastOfDay
              )
              const fcmNotification = this.formatFCMNotification(
                tasks[i],
                participantLogin
              )
              localNotifications.push(localNotification)
              fcmNotifications.push(fcmNotification)
            }
          }
          if (DefaultNotificationType === 'LOCAL') {
            console.log('NOTIFICATIONS Scheduling LOCAL notifications')
            ;(<any>cordova).plugins.notification.local.on(
              'click',
              notification => this.evalTaskTiming(notification.data)
            )
            ;(<any>cordova).plugins.notification.local.on(
              'trigger',
              notification => this.evalLastTask(notification.data)
            )
            return (<any>cordova).plugins.notification.local.schedule(
              localNotifications[0],
              () => {
                return Promise.resolve({})
              }
            )
          }
          if (DefaultNotificationType === 'FCM') {
            console.log('NOTIFICATIONS Scheduling FCM notifications')
            console.log(fcmNotifications)
            this.upstreamResendAttempts = 0
            return Promise.all(
              fcmNotifications.map(n => this.sendFCMNotification(n))
            ).then(() =>
              this.storage.set(StorageKeys.LAST_NOTIFICATION_UPDATE, Date.now())
            )
          }
        } else Promise.reject()
      })
  }

  sendFCMNotification(notification) {
    FirebasePlugin.upstream(
      notification,
      succ => console.log(succ),
      err => {
        if (this.upstreamResendAttempts++ < DefaultMaxUpstreamResends) {
          console.log(err)
          this.sendFCMNotification(notification)
        }
      }
    )
    return Promise.resolve()
  }

  sendTestFCMNotification() {
    return this.storage
      .get(StorageKeys.PARTICIPANTLOGIN)
      .then(participantLogin => {
        if (participantLogin) {
          const task = DefaultTaskTest
          task.timestamp =
            new Date().getTime() + getMilliseconds({ minutes: 2 })
          const fcmNotification = this.formatFCMNotification(
            task,
            participantLogin
          )
          return this.sendFCMNotification(fcmNotification)
        } else Promise.reject()
      })
  }

  formatNotifMessageAndTitle(task) {
    if (task.name == 'TEST') {
      return {
        title: this.translate.transform(
          LocKeys.NOTIFICATION_TEST_REMINDER_NOW.toString()
        ),
        message: this.translate.transform(
          LocKeys.NOTIFICATION_TEST_REMINDER_NOW_DESC.toString()
        )
      }
    } else {
      return {
        title: this.translate.transform(
          LocKeys.NOTIFICATION_REMINDER_NOW.toString()
        ),
        message:
          this.translate.transform(
            LocKeys.NOTIFICATION_REMINDER_NOW_DESC_1.toString()
          ) +
          ' ' +
          task.estimatedCompletionTime +
          ' ' +
          this.translate.transform(
            LocKeys.NOTIFICATION_REMINDER_NOW_DESC_2.toString()
          )
      }
    }
  }

  formatLocalNotification(task, isLastScheduledNotification, isLastOfDay) {
    const notif = this.formatNotifMessageAndTitle(task)
    const notification = {
      id: task.index,
      title: notif.title,
      text: notif.message,
      trigger: { at: new Date(task.timestamp) },
      foreground: true,
      vibrate: true,
      sound: 'file://assets/sounds/serious-strike.mp3',
      data: {
        task: task,
        isLastOfDay: isLastOfDay,
        isLastScheduledNotification: isLastScheduledNotification
      }
    }
    return notification
  }

  formatFCMNotification(task, participantLogin) {
    const notif = this.formatNotifMessageAndTitle(task)
    const fcmNotification = {
      eventId: uuid(),
      action: 'SCHEDULE',
      notificationTitle: notif.title,
      notificationMessage: notif.message,
      time: task.timestamp,
      subjectId: participantLogin,
      ttlSeconds: getSeconds({ milliseconds: task.completionWindow })
    }
    return fcmNotification
  }

  cancelNotificationPush(participantLogin) {
    return this.sendFCMNotification({
      eventId: uuid(),
      action: 'CANCEL',
      cancelType: 'all',
      subjectId: participantLogin
    })
  }

  evalIsLastOfDay(task1, task2) {
    const date1 = new Date(task1.timestamp)
    const date2 = new Date(task2.timestamp)
    const day1 = date1.getDay()
    const day2 = date2.getDay()
    // TODO: needs to be determined better
    const isLastOfDay = false
    return isLastOfDay
  }

  evalTaskTiming(data) {
    const task = data.task
    const scheduledTimestamp = task.timestamp
    const now = new Date().getTime()
    const endScheduledTimestamp = scheduledTimestamp + task.completionWindow
    if (now > endScheduledTimestamp && task.name === 'ESM') {
      this.showNotificationMissedInfo(task, data.isLastOfDay)
    }
    ;(<any>cordova).plugins.notification.local.clearAll()
  }

  evalLastTask(data) {
    if (data.isLastScheduledNotification) {
      this.scheduleNextNotification()
    }
  }

  scheduleNextNotification() {
    this.generateNotificationSubsetForXTasks(
      DefaultNumberOfNotificationsToSchedule +
        DefaultNumberOfNotificationsToRescue
    ).then(desiredSubset => {
      console.log('NOTIFICATION RESCHEDULE')
      const immediateNotification = [desiredSubset[0]]
      this.setNotifications(immediateNotification)
      const nextdate = new Date(
        desiredSubset[desiredSubset.length - 1].timestamp
      )
      this.schedule.getTasksForDate(nextdate).then(tasks => {
        const rescueTasks = [tasks[0]]
        this.setNotifications(rescueTasks)
      })
    })
  }

  consoleLogScheduledNotifications() {
    ;(<any>cordova).plugins.notification.local.getScheduled(notifications => {
      console.log(`\nNOTIFICATIONS NUMBER ${notifications.length}\n`)
      const dailyNotifies = {}
      for (let i = 0; i < notifications.length; i++) {
        const data = JSON.parse(notifications[i]['data'])
        const trigger = new Date(notifications[i]['trigger']['at']).toString()
        const key = trigger.substr(4, 11)
        const name = data['task']['name']
        const id = notifications[i].id
        const rendered = `${i} ID ${id} TIME ${trigger.substr(
          15
        )} NAME ${name}\n`

        const tmp = dailyNotifies[key]
        if (tmp === undefined) {
          dailyNotifies[key] = `\nNOTIFICATIONS DATE ${key}\n` + rendered
        } else {
          dailyNotifies[key] += rendered
        }
      }
      const keys = Object.keys(dailyNotifies)
      keys.sort()
      console.log(
        `\n NOTIFICATIONS Scheduled Notifications (${notifications.length}):\n`
      )
      for (let i = 0; i < keys.length; i++) {
        console.log(dailyNotifies[keys[i]])
      }
      ;(<any>cordova).plugins.notification.local.cancelAll(() => {
        this.evalLastTask({ isLastScheduledNotification: true })
      })
    })
  }

  showNotificationMissedInfo(task: Task, isLastOfDay: boolean) {
    const msgDefault = this.translate.transform(
      LocKeys.NOTIFICATION_REMINDER_FORGOTTEN_ALERT_DEFAULT_DESC.toString()
    )
    const msgLastOfDay = this.translate.transform(
      LocKeys.NOTIFICATION_REMINDER_FORGOTTEN_ALERT_LASTOFNIGHT_DESC.toString()
    )
    return this.alertService.showAlert({
      title: this.translate.transform(
        LocKeys.NOTIFICATION_REMINDER_FORGOTTEN.toString()
      ),
      message: isLastOfDay ? msgLastOfDay : msgDefault,
      buttons: [
        {
          text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
          handler: () => {}
        }
      ]
    })
  }

  setNextXNotifications(noOfNotifications) {
    return this.generateNotificationSubsetForXTasks(noOfNotifications).then(
      desiredSubset => {
        console.log(`NOTIFICATIONS desiredSubset: ${desiredSubset.length}`)
        try {
          if (!desiredSubset.length) return Promise.reject()
          return this.setNotifications(desiredSubset)
        } catch (e) {
          return Promise.reject(e)
        }
      }
    )
  }

  cancelNotifications() {
    return this.storage
      .get(StorageKeys.PARTICIPANTLOGIN)
      .then(
        participantLogin =>
          participantLogin && this.cancelNotificationPush(participantLogin)
      )
  }
}