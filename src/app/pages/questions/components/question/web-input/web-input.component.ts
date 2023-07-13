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

  textValue = ''
  inputValid = true
  NHS_URL = 'https://www.nhs.uk/nhs-services/online-services/find-nhs-number/'

  browserOptions: InAppBrowserOptions = {
    location: 'yes',
    hidenavigationbuttons: 'yes',
    hideurlbar: 'yes',
    toolbarcolor: '#6d9aa5',
    closebuttoncolor: '#ffffff'
  }

  constructor(
    private theInAppBrowser: InAppBrowser,
    private keyboard: Keyboard
  ) {}

  ngOnInit() {}

  emitAnswer(value) {
    const cleanedValue = value.replace(/\s/g, '')
    const valid = isValidNHSId(cleanedValue)
    if (valid) {
      this.valueChange.emit(this.textValue)
    } else this.inputValid = false
  }

  emitKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER) this.keyboard.hide()

    this.keyboardEvent.emit(value)
  }

  openUrl() {
    this.openWithInAppBrowser(this.NHS_URL)
  }

  openWithInAppBrowser(url: string) {
    this.theInAppBrowser.create(url, '_blank', this.browserOptions)
  }
}
