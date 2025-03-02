import {
  Component,
  EventEmitter,
  Input,
  OnChanges, OnInit,
  Output
} from '@angular/core'

import { LocalizationService } from '../../../../core/services/misc/localization.service'
import { LocKeys } from '../../../../shared/enums/localisations'

@Component({
  selector: 'toolbar',
  templateUrl: 'toolbar.component.html',
  styleUrls: ['toolbar.component.scss'],
  standalone: false,
})
export class ToolbarComponent implements OnInit, OnChanges {
  @Input()
  isLeftButtonDisabled: boolean
  @Input()
  isRightButtonDisabled: boolean
  @Input()
  currentQuestionId: number
  @Input()
  totalQuestions: number
  @Input()
  isProgressCountShown: boolean

  @Output()
  next: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  previous: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  finish: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  close: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  tappedDisabledButton: EventEmitter<any> = new EventEmitter<any>()

  textValues = {
    next: '',
    previous: '',
    finish: '',
    close: ''
  }
  rightButtonText = this.textValues.next
  leftButtonText = this.textValues.close
  iconValues = {
    previous: 'chevron-back-outline',
    close: 'close-circle'
  }
  iconPrevious: string = this.iconValues.close
  progress: number

  constructor(private localization: LocalizationService) {}

  ngOnInit() {
    this.textValues = {
      next: this.localization.translateKey(LocKeys.BTN_NEXT),
      previous: this.localization.translateKey(LocKeys.BTN_PREVIOUS),
      finish: this.localization.translateKey(LocKeys.BTN_FINISH),
      close: this.localization.translateKey(LocKeys.BTN_CLOSE)
    }
  }

  ngOnChanges() {
    this.setButtons()
    this.setProgress()
  }

  leftButtonHandler() {
    if (this.isLeftButtonDisabled) return
    switch (this.leftButtonText) {
      case this.textValues.previous:
        return this.previous.emit()
      case this.textValues.close:
        return this.close.emit()
      default:
        break
    }
  }

  rightButtonHandler() {
    if (this.isRightButtonDisabled) {
      this.tappedDisabledButton.emit()
      return
    }
    switch (this.rightButtonText) {
      case this.textValues.next:
        return this.next.emit()
      case this.textValues.finish:
        return this.finish.emit()
      default:
        break
    }
  }

  setButtons() {
    this.iconPrevious = this.getLeftButtonValues().icon
    this.leftButtonText = this.getLeftButtonValues().text
    this.rightButtonText = this.getRightButtonText()
  }

  getLeftButtonValues() {
    return !this.currentQuestionId
      ? { text: this.textValues.close, icon: this.iconValues.close }
      : { text: this.textValues.previous, icon: this.iconValues.previous }
  }

  getRightButtonText() {
    return this.currentQuestionId === this.totalQuestions - 1
      ? this.textValues.finish
      : this.textValues.next
  }

  setProgress() {
    this.progress = Math.ceil(
      (this.currentQuestionId * 100) / this.totalQuestions
    )
  }
}
