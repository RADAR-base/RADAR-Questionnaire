import { Component, EventEmitter, Input, Output, trigger, state, style, transition, animate, keyframes } from '@angular/core'
import { Task } from '../../models/task'

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

export class TaskInfoComponent {

  @Input() task: Task;
  @Output() expanded: Boolean = true
  hasExtraInfo: Boolean = true;
  animateFade: String
  animateScale: String
  animateCenterRight: String

  animationKeys = {
    MIN: 'min',
    MAX: 'max',
    IN: 'in',
    OUT: 'out',
    CENTER: 'center',
    RIGHT: 'right'
  }

  constructor() {
    this.applyAnimationKeys()
  }

  expand () {
    this.expanded = this.expanded ? false : true
    console.log(this.expanded)
    this.applyAnimationKeys()
  }

  applyAnimationKeys () {
    if(this.expanded){
      this.animateFade = this.animationKeys.IN
      this.animateScale = this.animationKeys.MAX
      this.animateCenterRight = this.animationKeys.CENTER
    } else {
      this.animateFade = this.animationKeys.OUT
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
