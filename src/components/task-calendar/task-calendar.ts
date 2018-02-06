import { Component, OnChanges, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core'
import { NavController } from 'ionic-angular'
import { HomeController } from '../../providers/home-controller'
import { Task } from '../../models/task'
import { DefaultTask } from '../../assets/data/defaultConfig'

@Component({
  selector: 'task-calendar',
  templateUrl: 'task-calendar.html'
})
export class TaskCalendarComponent implements OnChanges {

  @Input() scrollHeight: number = 0
  @Output() task: EventEmitter<Task> = new EventEmitter<Task>()

  currentTime: String = '06:00'
  timeIndex = 0

  tasks: Task[] = [DefaultTask]

  constructor (private controller: HomeController) {
    this.controller.getTasksOfToday().then((tasks) => {
      if(tasks) {
        this.tasks = tasks.sort(this.compareTasks)
      }
    })
  }

  ngOnChanges () {
    this.setCurrentTime()
  }

  getStartTime (task: Task) {
    let date = new Date(task.timestamp)
    return this.formatTime(date)
  }

  setCurrentTime () {
    let now = new Date()
    this.currentTime = this.formatTime(now)
    this.timeIndex = this.getCurrentTimeIndex(now)
  }

  // Compare current time with the start times of the tasks and find
  // out in between which tasks it should be shown in the interface
  getCurrentTimeIndex (date: Date) {
    var tasksPassed = 0
    for(let task of this.tasks) {
      if(date.getTime() <= task.timestamp) {
        return tasksPassed
      } else {
        tasksPassed += 1
      }
    }
    return tasksPassed
  }

  formatTime (date) {
    let hour = date.getHours()
    let min = date.getMinutes()
    let hourStr = date.getHours() < 10 ? '0'+String(hour) : String(hour)
    let minStr = date.getMinutes() < 10 ? '0'+String(min) : String(min)
    return hourStr + ':' + minStr
  }

  // Define the order of the tasks - whether it is based on index or timestamp
  compareTasks (a: Task, b: Task) {
    if (a.timestamp < b.timestamp) {
      return -1
    }
    if (a.timestamp > b.timestamp) {
      return 1;
    }
    return 0;
  }

  hasExtraInfo(warningStr) {
    //console.log(warningStr)
    if(warningStr == '') {
      return false
    }
    return true
  }

  clicked(task) {
    if(task.name != "ESM" && !task.completed){
      this.task.emit(task)
    } else {
      let now = new Date()
      let taskTimestamp = new Date(task.timestamp)
      if(taskTimestamp > now && !task.completed) {
        this.task.emit(task)
      }
    }
  }

}
