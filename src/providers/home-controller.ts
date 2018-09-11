import { Injectable } from '@angular/core'
import { StorageService } from './storage-service'
import { SchedulingService } from './scheduling-service'
import { Task, TasksProgress } from '../models/task'
import { Assessment } from '../models/assessment'
import { NotificationService } from './notification-service'
import { StorageKeys } from '../enums/storage'
import { KafkaService } from './kafka-service'

@Injectable()
export class HomeController {

  constructor (public storage: StorageService,
              private schedule: SchedulingService,
              private notifications: NotificationService,
              private kafka: KafkaService) {
  }

  evalEnrolment () {
    return this.storage.getAllKeys().then((keys) => {
      return keys.length <= 5
    })
  }

  getAssessment (task) {
    return this.storage.getAssessment(task)
  }

  getClinicalAssessment (task) {
    return this.storage.getClinicalAssessment(task)
  }

  updateAssessmentIntroduction (assessment) {
    if (assessment.showIntroduction) {
      const assessmentUpdated = assessment
      assessmentUpdated.showIntroduction = false
      this.storage.updateAssessment(assessmentUpdated)
    }
  }

  getTasksOfToday () {
    const now = new Date()
    return this.schedule.getTasksForDate(now)
  }

  getTasksOfDate (timestamp) {
    return this.schedule.getTasksForDate(timestamp)
  }

  getTaskProgress () {
    return this.getTasksOfToday()
      .then((tasks: Task[]) => this.retrieveTaskProgress(tasks))
  }

  getClinicalTasks () {
    return this.storage.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
  }

  setNextXNotifications (noOfNotifications) {
    const today = new Date().getTime()
    const promises = []
    return this.notifications.generateNotificationSubsetForXTasks(noOfNotifications)
    .then((desiredSubset) => {
      console.log(`NOTIFICATIONS desiredSubset: ${desiredSubset.length}`)
      try {
        return this.notifications.setNotifications(desiredSubset)
      } catch (e) {
        return Promise.resolve({})
      }
    })
  }

  cancelNotifications () {
    return this.storage.get(StorageKeys.PARTICIPANTLOGIN)
    .then((participantLogin) => {
      return this.notifications.cancelNotificationPush(participantLogin)
    } )
  }

  consoleLogNotifications () {
    this.notifications.consoleLogScheduledNotifications()
  }

  consoleLogSchedule () {
    this.schedule.getTasks()
    .then((tasks) => {
      const tasksKeys = []
      for (let i = 0; i < tasks.length; i++) {
        tasksKeys.push(`${tasks[i].timestamp}-${tasks[i].name}`)
      }
      tasksKeys.sort()
      let rendered = `\nSCHEDULE Total (${tasksKeys.length})\n`
      for (let i = (tasksKeys.length - 10); i < tasksKeys.length; i++) {
        const dateName = tasksKeys[i].split('-')
        rendered += `${tasksKeys[i]} DATE ${new Date(parseInt(dateName[0], 10)).toString()} NAME ${dateName[1]}\n`
      }
      console.log(rendered)
    })
  }

  retrieveTaskProgress (tasks): TasksProgress {
    const tasksProgress: TasksProgress = {
      numberOfTasks: 0,
      completedTasks: 0
    }
    if (tasks) {
      tasksProgress.numberOfTasks = tasks.length
      for (let i = 0; i < tasks.length;i++) {
        if (tasks[i].completed) {
          tasksProgress.completedTasks += 1
        }
      }
      return tasksProgress
    }
  }

  getNextTask () {
    return this.getTasksOfToday()
            .then((tasks: Task[]) => this.retrieveNextTask(tasks))
  }

  areAllTasksComplete () {
    return this.getTasksOfToday()
    .then((tasks: Task[]) => {
      return this.checkIfAllTasksComplete(tasks)
    })
  }

  retrieveNextTask (tasks): Task {
    if (tasks) {
      const now: Date = new Date()
      const offsetTimeESM: number = 1000 * 60 * 10 // 10 min
      let passedAtLeastOnce = false
      let nextIdx = 0
      let timestamp: number = now.getTime()
      let nextTimestamp: number = timestamp
      for (let i = 0; i < tasks.length; i++) {
        switch (tasks[i].name) {
          case 'ESM' :
          //
            timestamp = new Date().getTime() - offsetTimeESM
            nextTimestamp = timestamp + 1000 * 60 * 60 * 12
            break

          default:
          // Check from midnight for other tasks
            now.setHours(0, 0, 0, 0)
            timestamp = now.getTime()
            nextTimestamp = tasks[i].timestamp + 1000 * 60 * 60 * 12
        }

        if (tasks[i].timestamp >= timestamp &&
            tasks[i].timestamp < nextTimestamp &&
            tasks[i].completed === false) {
          passedAtLeastOnce = true
          nextTimestamp = tasks[i].timestamp
          nextIdx = i
        }
      }
      if (passedAtLeastOnce) {
        // console.log('NEXT TASK')
        // console.log(tasks[nextIdx])
        return tasks[nextIdx]
      }
    }
  }

  checkIfAllTasksComplete (tasks: Task[]): boolean {
    let status = true
    if (tasks) {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].name !== 'ESM') {
          if (tasks[i].completed === false) {
            status = false
          }
        }
      }
    }
    return status
  }

  sendNonReportedTaskCompletion () {
    this.schedule.getNonReportedCompletedTasks()
      .then((nonReportedTasks) => {
        for (let i = 0; i < nonReportedTasks.length; i++) {
          this.kafka.prepareNonReportedTasksKafkaObject(nonReportedTasks[i])
          this.updateTaskToReportedCompletion(nonReportedTasks[i])
        }
      })
  }

  updateTaskToComplete (task): Promise<any> {
    const updatedTask = task
    updatedTask.completed = true
    return this.schedule.insertTask(updatedTask)
  }

  updateTaskToReportedCompletion (task): Promise<any> {
    const updatedTask = task
    updatedTask.reportedCompletion = true
    return this.schedule.insertTask(updatedTask)
  }

}
