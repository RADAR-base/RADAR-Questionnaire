import { Component, ViewChild, ElementRef } from '@angular/core';
import { RoundProgressConfig } from 'angular-svg-round-progressbar';


@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.html'
})
export class TaskProgressComponent {

  text: string;
  max: number = 3
  current: number = 0
  radius: number = 120
  duration: number = 800

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
      this.current += 1
      this.transitionToComplete()
    } else {
      this.current += 1
      this.elComplete.nativeElement.style.transform =
      'scale(0.1)'
      this.elCheckmark.nativeElement.style.transform =
      'scale(5)'
    }
  }

  transitionToComplete () {
    this.elActive.nativeElement.style.transform =
    'translate3d(-100%,0,0) scale(0.1)'
    this.elComplete.nativeElement.style.transform =
    'translate3d(-100%,0,0) scale(1)'
    this.elCheckmark.nativeElement.style.transform =
    'scale(1)'
    this.elCounter.nativeElement.style.transform =
    'translate3d(0,250px,0)'
  }

}
