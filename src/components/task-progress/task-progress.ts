import { Component } from '@angular/core';
import { RoundProgressConfig } from 'angular-svg-round-progressbar';


@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.html'
})
export class TaskProgressComponent {

  text: string;
  max: number = 100
  current: number = 8
  radius = 120

  constructor(private progConfig: RoundProgressConfig) {
    progConfig.setDefaults({
      'color':'#7fcdbb',
      'background': 'rgba(255,255,204,0.12)',
      'stroke': 22,
      'animation': 'easeInOutQuart',
      'duration': 800
    })
    
  }

  increment () {
    this.current += 20
  }

}
