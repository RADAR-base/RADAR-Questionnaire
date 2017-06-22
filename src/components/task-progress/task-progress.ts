import { Component } from '@angular/core';

/**
 * Generated class for the TaskProgress component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.html'
})
export class TaskProgressComponent {

  text: string;

  constructor() {
    console.log('Hello TaskProgress Component');
    this.text = 'Hello World';
  }

}
