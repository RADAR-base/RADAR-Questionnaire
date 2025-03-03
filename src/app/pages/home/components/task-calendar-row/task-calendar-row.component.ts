import { Component, Input, OnInit } from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { Task } from '../../../../shared/models/task'
import { IonicModule } from '@ionic/angular'
import { NgIf } from '@angular/common'
import { addIcons } from 'ionicons'
import { radioButtonOff } from 'ionicons/icons'

@Component({
  selector: 'task-calendar-row',
  templateUrl: 'task-calendar-row.component.html',
  styleUrls: ['task-calendar-row.component.scss'],
  imports: [IonicModule, NgIf]
})
export class TaskCalendarRowComponent implements OnInit {
  @Input()
  isTaskNameShown: boolean
  @Input()
  task

  taskLabel: string

  constructor(private localization: LocalizationService) {
    addIcons({radioButtonOff})
  }

  ngOnInit() {
    if (this.isTaskNameShown) this.taskLabel = this.task.name
    else this.taskLabel = this.getStartTime(this.task)
  }

  getStartTime(task: Task) {
    return this.localization.moment(task.timestamp).format('HH:mm')
  }
}
