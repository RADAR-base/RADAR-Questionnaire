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

  times: String[] = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
  currentTime: String = '06:00'
  currentMinutes: number = 0
  hourPixHeight: number = 25
  startOfDayMinutes: number = 360 // 6am

  tasks: Task[] = [DefaultTask]
  tasksTimes = []

  constructor(private controller: HomeController){
    this.controller.getTasksOfToday().then((tasks) => {
      if(tasks){
        this.tasks = tasks
      }
    })
  }

  ngOnChanges () {
    this.setCurrentTime()
  }

  setTaskTime (task:Task) {
    let date = new Date(task.timestamp)
    let offsetPixels = this.setTimePixel(date) - 5
    return offsetPixels
  }

  setCurrentTime () {
    let now = new Date()
    this.currentTime = this.formatTime(now)
    let offsetPixels = this.setTimePixel(now)
    this.elCurrentTime.nativeElement.style.transform =
      `translateY(${offsetPixels}px)`
    if(offsetPixels > 0 && offsetPixels < this.hourPixHeight*18){
      this.elCurrentTime.nativeElement.style.opacity = 1
    }
  }

  setTimePixel (date:Date) {
    let min = this.computeMinutesIntoDay(date)
    let offsetPixels = Math.round((min/60)*this.hourPixHeight)
                          -this.startOfDayMinutes/2
                          +this.hourPixHeight
    return offsetPixels
  }

  computeMinutesIntoDay (date) {
    let hour = date.getHours()
    let min = date.getMinutes()
    return hour*60 + min
  }

  formatTime(date){
    let hour = date.getHours()
    let min = date.getMinutes()
    let hourStr = date.getHours() < 10 ? '0'+String(hour) : String(hour)
    let minStr = date.getMinutes() < 10 ? '0'+String(min) : String(min)
    return hourStr + ':' + minStr
  }

}
