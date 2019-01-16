import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output, SimpleChanges
} from '@angular/core'
import { AlertController, Platform } from 'ionic-angular'

import { DefaultTask } from '../../../../../assets/data/defaultConfig'
import { LocKeys } from '../../../../shared/enums/localisations'
import { Task } from '../../../../shared/models/task'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { TasksService } from '../../services/tasks.service'

@Component({
  selector: 'task-list',
  templateUrl: 'task-list.component.html'
})
export class TaskListComponent implements OnChanges {

  @Input()
  tasks : Promise<Task[]>;

  @Output()
  task: EventEmitter<Task> = new EventEmitter<Task>()

  currentTime
  timeIndex: Promise<number>

  constructor(
    private tasksService: TasksService,
    private alertCtrl: AlertController,
    private translate: TranslatePipe,
    private platform: Platform
  ) {}

  ionViewDidLoad() {
    console.log('taskListloaded')
    this.tasks.then((result) => {
      console.log('tasks here ', result);
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setCurrentTime()
  }


  clicked(task) {
    if ( !task.completed) {
      this.task.emit(task)
    } else {
      const now = new Date()
      const nowPlusFifteen = new Date(now.getTime() + 1000 * 60 * 15)
      const taskTimestamp = new Date(task.timestamp)
      if (
        taskTimestamp > now &&
        taskTimestamp < nowPlusFifteen &&
        !task.completed
      ) {
        this.task.emit(task)
      }
    }
  }

  // NOTE: Compare current time with the start times of the tasks and
  // find out in between which tasks it should be shown in the interface
  getCurrentTimeIndex(date: Date) {
    let tasksPassed = 0
    return Promise.resolve(
      this.tasks.then(tasks => {
        for (const task of tasks) {
          if (date.getTime() <= task.timestamp) {
            return tasksPassed
          } else {
            tasksPassed += 1
          }
        }
        return tasksPassed
      })
    )
  }

  setCurrentTime() {
    const now = new Date()
    this.currentTime = this.tasksService.formatTime(now)
    this.timeIndex = this.getCurrentTimeIndex(now)
  }

}
