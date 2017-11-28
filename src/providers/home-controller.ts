import { Injectable } from '@angular/core';
import { StorageService } from './storage-service'
import { SchedulingService } from './scheduling-service'
import { Task, TasksProgress } from '../models/task'
import { Assessment } from '../models/assessment'

@Injectable()
export class HomeController {

  constructor(private storage: StorageService,
              private schedule: SchedulingService) {
  }

  evalEnrolement() {
    return this.storage.getAllKeys().then((keys) => {
      return keys.length <= 5
    })
  }

  getAssessment (task) {
    return this.storage.getAssessment(task)
  }

  updateAssessmentIntroduction (assessment) {
    if(assessment.showIntroduction){
      var assessmentUpdated = assessment
      assessmentUpdated.showIntroduction = false
      this.storage.updateAssessment(assessmentUpdated)
    }
  }

  getTasksOfToday () {
    let now = new Date()
    return this.schedule.getTasksForDate(now)
  }

  getTasksOfDate (timestamp) {
    return this.schedule.getTasksForDate(timestamp)
  }

  getTaskProgress () {
    return this.getTasksOfToday()
      .then((tasks:Task[]) => this.retrieveTaskProgress(tasks))
  }

  retrieveTaskProgress (tasks):TasksProgress {
    var tasksProgress: TasksProgress = {
      numberOfTasks: 0,
      completedTasks: 0
    }
    if(tasks) {
      tasksProgress.numberOfTasks = tasks.length
      for(var i = 0; i<tasks.length;i++){
        if(tasks[i].completed){
          tasksProgress.completedTasks +=1
        }
      }
    return tasksProgress
    }
  }

  getNextTask () {
    return this.getTasksOfToday()
            .then((tasks:Task[]) => this.retrieveNextTask(tasks))
  }

  areAllTasksComplete() {
    return this.getTasksOfToday()
    .then((tasks: Task[]) => {
      return this.checkIfAllTasksComplete(tasks)
    })
  }

  retrieveNextTask (tasks):Task {
    if(tasks) {
      let now = new Date()
      let timestamp = Date.now()
      var passedAtLeastOnce = false
      var nextIdx = 0
      var nextTimestamp = timestamp * 2
      for(var i = 0; i < tasks.length; i++){
        if(tasks[i].timestamp >= timestamp &&
            tasks[i].timestamp < nextTimestamp &&
            tasks[i].completed == false){
          passedAtLeastOnce = true
          nextTimestamp = tasks[i].timestamp
          nextIdx = i
        }
      }
      if(passedAtLeastOnce) {
        return tasks[nextIdx]
      }
    }
  }

  checkIfAllTasksComplete(tasks: Task[]) {
    var status = true
    for(var i = 0; i<tasks.length; i++) {
      if(tasks[i].completed == false) {
        status = false
      }
    }
    return status
  }

  updateTaskToComplete (task):Promise<any> {
    var updatedTask = task
    updatedTask.completed = true
    return this.schedule.insertTask(updatedTask)
  }
}
