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
import { NgStyle } from '@angular/common'
import { TranslatePipe } from '../../../../shared/pipes/translate/translate'
import { IonButton, IonItem, IonLabel, IonToggle } from '@ionic/angular/standalone'

@Component({
  selector: 'app-finish',
  templateUrl: 'finish.component.html',
  styleUrls: ['finish.component.scss'],
  imports: [
    TranslatePipe,
    NgStyle,
    IonItem,
    IonLabel,
    IonToggle,
    IonButton
  ]
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
    if (this.isShown) {
      this.usage.setPage(this.constructor.name)
    }

    this.showDoneButton = this.progressCount >= 1

    this.displayNextTaskReminder =
      this.taskType == AssessmentType.SCHEDULED && !this.isLastTask

    this.innerText = this.getFinishButtonText(this.progressCount)
    this.shadowStyle = this.getProgressBarStyle(this.progressCount)

    // Ensure progress is within a valid range for displaying ETA
    this.progressDisplay = Math.min(
      Math.max(Math.ceil(this.progressCount * 100), 1),
      99
    )

    this.etaText = this.getEtaText(this.progressDisplay)
  }

  handleClosePage() {
    this.exit.emit(this.completedInClinic)
  }

  toggleChanged(event) {
    this.completedInClinic = event
  }

  getEtaText(progress) {
    if (progress <= 0) {
      return 'Calculating time remaining...'
    }

    const elapsedTime = (Date.now() - this.startTime) / 1000 // Convert milliseconds to seconds
    const remainingTime = (elapsedTime * (100 - progress)) / progress

    if (remainingTime >= 60) {
      const minutes = Math.floor(remainingTime / 60)
      const seconds = Math.round(remainingTime % 60)
      return `About ${minutes} minute${
        minutes > 1 ? 's' : ''
      } and ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
    }

    return `About ${remainingTime.toFixed(0)} second${
      remainingTime.toFixed(0) !== '1' ? 's' : ''
    } remaining`
  }

  getProgressBarStyle(progress) {
    return progress >= 1
      ? `inset 500px 0 0 -50px var(--cl-primary-60)`
      : `inset ${progress * 400}px 0 0 -50px var(--cl-primary-60)`
  }

  getFinishButtonText(progress) {
    return progress < 1
      ? this.localization.translateKey(LocKeys.SETTINGS_WAIT_ALERT) + '...'
      : this.localization.translateKey(LocKeys.BTN_DONE)
  }
}
