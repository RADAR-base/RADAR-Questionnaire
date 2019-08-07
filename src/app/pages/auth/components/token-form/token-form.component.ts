import { Component, EventEmitter, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { DefaultEnrolmentBaseURL } from '../../../../../assets/data/defaultConfig'
import { isValidURL } from '../../../../shared/utilities/form-validators'

@Component({
  selector: 'token-form',
  templateUrl: 'token-form.component.html'
})
export class TokenFormComponent {
  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  focus: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  errors: EventEmitter<any> = new EventEmitter<any>()

  metaQRForm: FormGroup = new FormGroup({
    baseURL: new FormControl(DefaultEnrolmentBaseURL),
    tokenName: new FormControl('')
  })

  submitForm() {
    const baseURL = this.metaQRForm.get('baseURL').value.trim()
    const token = this.metaQRForm.get('tokenName').value.trim()
    if (!isValidURL(baseURL))
      return this.errors.emit({ error: { message: 'Enter a valid URL' } })
    this.data.emit([baseURL, token])
  }

  onFocus() {
    this.focus.emit()
  }
}
