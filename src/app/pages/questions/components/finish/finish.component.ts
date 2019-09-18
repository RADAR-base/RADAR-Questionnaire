import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { UsageService } from '../../../../core/services/usage/usage.service'
import { Assessment } from '../../../../shared/models/assessment'
import { Task } from '../../../../shared/models/task'

@Component({
  selector: 'finish',
  templateUrl: 'finish.component.html'
})
export class FinishComponent implements OnChanges {
  @Input()
  content = ''
  @Input()
  isClinicalTask = false
  @Input()
  displayNextTaskReminder = true
  @Input()
  showDoneButton: boolean
  @Input()
  isShown: boolean

  @Output()
  exit: EventEmitter<any> = new EventEmitter<any>()

  task: Task
  questionnaireData
  assessment: Assessment
  completedInClinic = false

  constructor(private usage: UsageService) {}

  ngOnChanges() {
    if (this.isShown) {
      this.usage.setPage(this.constructor.name)
      setTimeout(() => (this.showDoneButton = true), 15000)
    }
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }
}
