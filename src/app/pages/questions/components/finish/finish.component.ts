import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { UsageService } from '../../../../core/services/usage/usage.service'
import { AssessmentType } from '../../../../shared/models/assessment'
import { QuestionsService } from '../../services/questions.service'
import { LocalizationService } from 'src/app/core/services/misc/localization.service'
import { LocKeys } from 'src/app/shared/enums/localisations'

@Component({
  selector: 'finish',
  templateUrl: 'finish.component.html',
  styleUrls: ['finish.component.scss']
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
  @Input()
  task
  @Input()
  questions
  @Input()
  progressCount
  @Output()
  exit: EventEmitter<any> = new EventEmitter<any>()

  innerText = ''
  displayNextTaskReminder = true
  completedInClinic = false

  constructor(
    private usage: UsageService,
    private localization: LocalizationService
  ) {}

  ngOnChanges() {
    this.displayNextTaskReminder =
      this.taskType == AssessmentType.SCHEDULED && !this.isLastTask
    this.innerText = this.localization.translateKey(LocKeys.STATUS_SENDING)
    if (this.isShown) this.usage.setPage(this.constructor.name)
    if (this.showDoneButton) {
      this.innerText = this.localization.translateKey(LocKeys.BTN_DONE)
    }
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }

  toggleChanged(event) {
    this.completedInClinic = event
  }
}
