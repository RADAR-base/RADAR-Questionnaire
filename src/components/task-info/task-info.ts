import { Component, EventEmitter, Input } from '@angular/core'
import { Task } from '../../models/task'

/**
 * Generated class for the TaskInfo component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'task-info',
  templateUrl: 'task-info.html'
})
export class TaskInfoComponent {

  @Input() task: Task;
  hasExtraInfo: Boolean = false;

  constructor() {
  }

  test () {
    return 'test'
  }

  getExtraInfo () {
   try {
    let info = this.task['extraInfo']
    this.hasExtraInfo = true
    return info
  } catch (e) {
    console.log(e)
    this.hasExtraInfo = false
  }
  }
}
