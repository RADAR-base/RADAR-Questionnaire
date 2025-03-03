import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { KeyboardEventType } from 'src/app/shared/enums/events'
import { WebInputType } from 'src/app/shared/models/question'
import { isValidNHSId } from 'src/app/shared/utilities/form-validators'
import { Browser, OpenOptions } from '@capacitor/browser'
import { Keyboard } from '@capacitor/keyboard'
import { FormsModule } from '@angular/forms'
import { IonButton, IonContent, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone'

@Component({
  selector: 'app-web-input',
  templateUrl: 'web-input.component.html',
  styleUrls: ['web-input.component.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonLabel,
    IonItem,
    IonInput,
    IonButton
  ]
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

  keyboard = Keyboard
  browser = Browser

  url: string
  validator
  textValue = ''
  inputValid = true
  NHS_URL = 'https://www.nhs.uk/nhs-services/online-services/find-nhs-number/'

  browserOptions: OpenOptions = {
    url: '',
    toolbarColor: '#6d9aa5'
  }

  constructor() {}

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
    const options = Object.assign({}, this.browserOptions, { url })
    this.browser.open(options)
  }

  getWebUrl() {
    switch (this.type) {
      case WebInputType.NHS:
        return this.NHS_URL
      default:
        return this.NHS_URL
    }
  }

  getInputValidator() {
    switch (this.type) {
      case WebInputType.NHS:
        return isValidNHSId
      default:
        return isValidNHSId
    }
  }
}
