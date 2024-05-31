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
import { getMinutes } from 'src/app/shared/utilities/time'

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
  shadowStyle = 'inset 100px 0 0 -50px #0B4A59'
  progressDisplay = 0
  startTime = Date.now()
  etaText = ''

  constructor(
    private usage: UsageService,
    private localization: LocalizationService
  ) {}

  ngOnChanges() {
    if (this.isShown) this.usage.setPage(this.constructor.name)
    if (this.progressCount == 1) this.showDoneButton = true
    this.displayNextTaskReminder =
      this.taskType == AssessmentType.SCHEDULED && !this.isLastTask
    this.innerText = this.getFinishButtonText(this.progressCount)
    this.shadowStyle = this.getProgressBarStyle(this.progressCount)
    this.progressDisplay = Math.ceil(this.progressCount) * 100
    this.etaText = this.getEtaText(this.progressCount)
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }

  toggleChanged(event) {
    this.completedInClinic = event
  }

  getEtaText(progress) {
    const duration = getMinutes({ milliseconds: Date.now() - this.startTime })
    return (
      'About ' + (duration * (100 - progress)) / progress + ' minutes remaining'
    )
  }

  getProgressBarStyle(progress) {
    return progress >= 1
      ? `inset 500px 0 0 -50px var(--cl-primary-60)`
      : `inset ${progress * 400}px 0 0 -50px var(--cl-primary-60)`
  }

  getFinishButtonText(progress) {
    return progress >= 1
     ? this.localization.translateKey(LocKeys.SETTINGS_WAIT_ALERT) + '...'
     : this.localization.translateKey(LocKeys.BTN_DONE)
  }
}
