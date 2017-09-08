import { Component, OnChanges, ViewChild, ElementRef, Input} from '@angular/core'
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

  @ViewChild('timeCurrent')
  elCurrentTime: ElementRef;

  currentTime: String = '06:00'
  taskHeightStart = 40
  taskHeight = 42

  tasks: Task[] = [DefaultTask]
  tasksTimes = []

  constructor(private controller: HomeController){
    this.controller.getTasksOfToday().then((tasks) => {
      if(tasks){
        this.tasks = tasks.sort(this.compareTasks)
      }
    })
  }

  ngOnChanges () {
    this.setCurrentTime()
  }

  getStartTime (task:Task) {
    let date = new Date(task.timestamp)
    return this.formatTime(date)
  }

  setCurrentTime() {
    let now = new Date()
    this.currentTime = this.formatTime(now)
    let offsetPixels = this.setTimePixel(now)
    this.elCurrentTime.nativeElement.style.transform =
      `translateY(${offsetPixels}px)`
  }

  setTimePixel(date:Date) {
    var tasksPassed = 0
    for(let task of this.tasks) {
      if(date.getTime() <= task.timestamp) {
         return this.taskHeightStart+tasksPassed*this.taskHeight
      }
      else {
        tasksPassed += 1
      }
    }
    return this.taskHeightStart+tasksPassed*this.taskHeight
  }

  formatTime(date){
    let hour = date.getHours()
    let min = date.getMinutes()
    let hourStr = date.getHours() < 10 ? '0'+String(hour) : String(hour)
    let minStr = date.getMinutes() < 10 ? '0'+String(min) : String(min)
    return hourStr + ':' + minStr
  }

  // Define the order of the tasks - whether it is based on index or timestamp
  compareTasks(a:Task,b:Task) {
    if (a.timestamp < b.timestamp)
      return -1;
    if (a.timestamp > b.timestamp)
      return 1;
    return 0;
  }

}
