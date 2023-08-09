import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import {
  InAppBrowser,
  InAppBrowserOptions
} from '@awesome-cordova-plugins/in-app-browser/ngx'
import { Keyboard } from '@ionic-native/keyboard/ngx'
import { KeyboardEventType } from 'src/app/shared/enums/events'
import { WebInputType } from 'src/app/shared/models/question'
import { isValidNHSId } from 'src/app/shared/utilities/form-validators'

@Component({
  selector: 'web-input',
  templateUrl: 'web-input.component.html',
  styleUrls: ['web-input.component.scss']
})
export class WebInputComponent implements OnInit {
  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>()
  @Output()
  keyboardEvent: EventEmitter<string> = new EventEmitter<string>()
  @Input()
  text: string
  @Input()
  currentlyShown: boolean
  @Input()
  type: string

  url: string
  validator
  textValue = ''
  inputValid = true
  NHS_URL = 'https://www.nhs.uk/nhs-services/online-services/find-nhs-number/'

  browserOptions: InAppBrowserOptions = {
    location: 'no',
    hidenavigationbuttons: 'yes',
    hideurlbar: 'yes',
    toolbarcolor: '#6d9aa5',
    closebuttoncolor: '#ffffff'
  }

  constructor(
    private theInAppBrowser: InAppBrowser,
    private keyboard: Keyboard
  ) {}

  ngOnInit() {
      this.url = this.getWebUrl()
      this.validator = this.getInputValidator()
  }

  emitAnswer(value) {
    const valid = this.validator(this.textValue)
    if (valid) {
      this.valueChange.emit(this.textValue)
      this.inputValid = true
    } else this.inputValid = false
  }

  emitKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER) this.keyboard.hide()

    this.keyboardEvent.emit(value)
  }

  openUrl() {
    this.openWithInAppBrowser(this.url)
  }

  openWithInAppBrowser(url: string) {
    this.theInAppBrowser.create(url, '_blank', this.browserOptions)
  }

  getWebUrl() {
    switch(this.type) {
      case WebInputType.NHS: 
        return this.NHS_URL
      default:
        return this.NHS_URL
    }
  }

  getInputValidator() {
    switch(this.type) {
      case WebInputType.NHS: 
        return isValidNHSId
      default:
        return isValidNHSId
    } 
  }
}
