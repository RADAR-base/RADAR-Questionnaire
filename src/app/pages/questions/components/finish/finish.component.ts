import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { UsageService } from '../../../../core/services/usage/usage.service'
import { AssessmentType } from '../../../../shared/models/assessment'

@Component({
  selector: 'finish',
  templateUrl: 'finish.component.html'
})
export class FinishComponent implements OnChanges {
  @Input()
  content = ''
  @Input()
  showDoneButton: boolean
  @Input()
  isShown: boolean
  @Input()
  requiresInClinicCompletion = false
  @Input()
  taskType: AssessmentType
  @Input()
  isLastTask = false
  @Output()
  exit: EventEmitter<any> = new EventEmitter<any>()

  displayNextTaskReminder = true
  completedInClinic = false

  constructor(private usage: UsageService) {}

  ngOnChanges() {
    this.displayNextTaskReminder =
      this.taskType == AssessmentType.SCHEDULED && !this.isLastTask
    if (this.isShown) {
      this.usage.setPage(this.constructor.name)
      setTimeout(() => (this.showDoneButton = true), 15000)
    }
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }
}
