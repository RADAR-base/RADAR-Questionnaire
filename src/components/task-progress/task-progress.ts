import { Component, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { RoundProgressConfig } from 'angular-svg-round-progressbar';


@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.html'
})
export class TaskProgressComponent {

  @Output() completed: EventEmitter<Boolean> = new EventEmitter()

  text: string;
  max: number = 3
  current: number = 0
  radius: number = 120
  duration: number = 800
  complete: boolean = false

  @ViewChild('progressActive')
  elActive: ElementRef
  @ViewChild('progressComplete')
  elComplete: ElementRef
  @ViewChild('checkmark')
  elCheckmark: ElementRef
  @ViewChild('counter')
  elCounter: ElementRef

  constructor(private progConfig: RoundProgressConfig) {
    progConfig.setDefaults({
      'color':'#7fcdbb',
      'background': 'rgba(255,255,204,0.12)',
      'stroke': 22,
      'animation': 'easeInOutQuart',
      'duration': this.duration
    })
  }

  increment () {
    if(this.current >= this.max-1){
      this.current = this.max
      this.complete = true
    } else {
      this.current += 1
      this.complete = false
    }
    this.transitionToComplete()
    this.completed.emit(this.complete)
  }

  transitionToComplete () {
    if(this.complete){
      this.elActive.nativeElement.style.transform =
      'translate3d(-100%,0,0) scale(0.1)'
      this.elComplete.nativeElement.style.transform =
      'translate3d(-100%,0,0) scale(1)'
      this.elCheckmark.nativeElement.style.transform =
      'scale(1)'
      this.elCounter.nativeElement.style.transform =
      'translate3d(0,250px,0)'
    } else {
      this.elComplete.nativeElement.style.transform =
      'scale(0.1)'
      this.elCheckmark.nativeElement.style.transform =
      'scale(5)'
    }
  }

}
