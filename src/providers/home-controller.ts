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

  getTaskProgress () {
    let now = new Date()
    return this.schedule.getTasksForDate(now)
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
    let now = new Date()
    return this.schedule.getTasksForDate(now)
            .then((tasks:Task[]) => this.retrieveNextTask(tasks))
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
      if(passedAtLeastOnce){
        return tasks[nextIdx]
      }
    }
  }

  updateTaskToComplete (task):Promise<any> {
    var updatedTask = task
    updatedTask.completed = true
    return this.schedule.insertTask(updatedTask)
  }
}
