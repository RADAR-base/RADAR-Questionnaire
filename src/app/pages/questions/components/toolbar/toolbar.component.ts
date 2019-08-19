import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { LocKeys } from '../../../../shared/enums/localisations'

@Component({
  selector: 'toolbar',
  templateUrl: 'toolbar.component.html'
})
export class ToolbarComponent implements OnChanges {
  @Input()
  isPreviousButtonDisabled: boolean
  @Input()
  isNextButtonDisabled: boolean
  @Input()
  currentQuestion: number
  @Input()
  totalQuestions: number

  @Output()
  next: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  previous: EventEmitter<any> = new EventEmitter<any>()

  textValues = {
    next: this.localization.translateKey(LocKeys.BTN_NEXT),
    previous: this.localization.translateKey(LocKeys.BTN_PREVIOUS),
    finish: this.localization.translateKey(LocKeys.BTN_FINISH),
    close: this.localization.translateKey(LocKeys.BTN_CLOSE)
  }

  nextButtonText = this.textValues.next
  previousButtonText = this.textValues.close

  iconValues = {
    previous: 'ios-arrow-back',
    close: 'close-circle'
  }
  iconPrevious: string = this.iconValues.close
  progress: number

  constructor(private localization: LocalizationService) {}

  ngOnChanges() {
    this.setButtons()
    this.setProgress()
  }

  nextQuestion() {
    this.next.emit()
  }

  previousQuestion() {
    this.previous.emit()
  }

  setButtons() {
    this.iconPrevious = this.getLeftButtonValues().icon
    this.previousButtonText = this.getLeftButtonValues().text
    this.nextButtonText = this.getRightButtonText()
  }

  getLeftButtonValues() {
    return !this.currentQuestion
      ? { text: this.textValues.close, icon: this.iconValues.close }
      : { text: this.textValues.previous, icon: this.iconValues.previous }
  }

  getRightButtonText() {
    return this.currentQuestion === this.totalQuestions - 1
      ? this.textValues.finish
      : this.textValues.next
  }

  setProgress() {
    this.progress = Math.ceil(
      (this.currentQuestion * 100) / this.totalQuestions
    )
  }
}
