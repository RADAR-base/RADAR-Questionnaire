import { Component, EventEmitter, Input, Output, trigger,
  state, style, transition, animate, keyframes, OnChanges } from '@angular/core'
import { Task, TasksProgress } from '../../models/task'
import { HomeController} from '../../providers/home-controller'

/**
 * Generated class for the TaskInfo component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'task-info',
  templateUrl: 'task-info.html',
  animations: [
   trigger('fade', [
     state('out', style({
       opacity: '0'
     })),
     state('in', style({
       opacity: '1.0'
     })),
     transition('in => out', animate('400ms ease')),
     transition('out => in', animate('400ms ease'))
   ]),
   trigger('scaleMinutes', [
     state('min', style({
       transform: 'translate3d(-25%, -15%, 0) scale(0.45)'
     })),
     state('max', style({
       transform: 'translate3d(0, 0, 0) scale(1)'
     })),
     transition('max => min', animate('400ms ease')),
     transition('min => max', animate('400ms ease'))
   ]),
   trigger('alignCenterRightExtraInfo', [
     state('right', style({
       transform: 'translate3d(15%, 0, 0)'
     })),
     state('center', style({
       transform: 'translate3d(0, 0, 0)'
     })),
     transition('center => right', animate('400ms ease')),
     transition('right => center', animate('400ms ease'))
   ]),
   trigger('alignCenterRightTime', [
     state('right', style({
       transform: 'translate3d(25%, 0, 0)'
     })),
     state('center', style({
       transform: 'translate3d(0, 0, 0)'
     })),
     transition('center => right', animate('400ms ease')),
     transition('right => center', animate('400ms ease'))
   ]),
   trigger('moveInProgress', [
     state('out', style({
       opacity: '0',
       transform: 'translate3d(-150%, 0, 0)'
     })),
     state('in', style({
       opacity: '1',
       transform: 'translate3d(0, 0, 0)'
     })),
     transition('out => in', animate('400ms ease')),
     transition('in => out', animate('400ms ease'))
   ]),
   trigger('alignCenterRightMetrics', [
     state('right', style({
       transform: 'translate3d(165%, 0, 0)'
     })),
     state('center', style({
       transform: 'translate3d(0, 0, 0)'
     })),
     transition('center => right', animate('400ms ease')),
     transition('right => center', animate('400ms ease'))
   ])
 ]
})

export class TaskInfoComponent implements OnChanges {

  @Input() task: Task;
  @Output() collapse: EventEmitter<Boolean> = new EventEmitter()
  expanded: Boolean = true
  hasExtraInfo: Boolean = true
  displayTask: Boolean = false
  animateFade: String
  animateMove: String
  animateScale: String
  animateCenterRight: String

  max: number = 1
  current: number = 0
  radius: number = 40
  stroke: number = 8
  progress: TasksProgress

  animationKeys = {
    MIN: 'min',
    MAX: 'max',
    IN: 'in',
    OUT: 'out',
    CENTER: 'center',
    RIGHT: 'right'
  }

  constructor(private controller: HomeController) {
    this.applyAnimationKeys()
  }

  ngOnChanges (changes) {
    if(this.task['timestamp'] > 0) {
      this.displayTask = true
    } else {
      this.displayTask = false
    }
  }

  expand () {
    this.collapse.emit(this.expanded)
    this.expanded = this.expanded ? false : true
    this.applyAnimationKeys()
    // TODO switching this on creates a rendering problem in iOS
    //this.updateProgress()
  }

  updateProgress () {
    this.controller.getTaskProgress().then((progress) => {
      this.progress = progress
      if(this.progress){
        this.max = this.progress.numberOfTasks
        this.current = this.progress.completedTasks
      }
    })
  }

  applyAnimationKeys () {
    if(this.expanded){
      this.animateFade = this.animationKeys.IN
      this.animateMove = this.animationKeys.OUT
      this.animateScale = this.animationKeys.MAX
      this.animateCenterRight = this.animationKeys.CENTER
    } else {
      this.animateFade = this.animationKeys.OUT
      this.animateMove = this.animationKeys.IN
      this.animateScale = this.animationKeys.MIN
      this.animateCenterRight = this.animationKeys.RIGHT
    }
  }

  getHour () {
    var date = new Date()
    date.setTime(this.task['timestamp'])
    let hour = date.getHours();
    //let hour12 = hour > 12 ? hour-12 : hour
    let formatedHour = this.formatSingleDigits(hour)
    return formatedHour
  }

  getMinutes () {
    var date = new Date()
    date.setTime(this.task['timestamp'])
    let formatedMinutes = this.formatSingleDigits(date.getMinutes())
    return formatedMinutes
  }

  getMeridiem () {
    var date = new Date()
    date.setTime(this.task['timestamp'])
    let hour = date.getHours();
    let meridiem = hour >= 12 ? "PM" : "AM";
    return meridiem
  }

  formatSingleDigits (number) {
    let format = number < 10 ? ('0'+String(number)) : String(number)
    return format
  }

  getExtraInfo () {
    var info = ''
    this.task['extraInfo'] = 'Requires a quiet space'
    info = this.task['extraInfo']
    this.hasExtraInfo = this.task['extraInfo'] != '' ? true : false
    return info
  }
}
