import { Component, EventEmitter, Input, Output } from '@angular/core'
import { OAuth2Client } from '@byteowls/capacitor-oauth2';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { DefaultOryAuthOptions } from 'src/assets/data/defaultConfig';

@Component({
  selector: 'ory-form',
  templateUrl: 'ory-form.component.html',
  styleUrls: ['ory-form.component.scss']
})
export class OryFormComponent {
  @Input()
  loading: boolean

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor() {}

  loginWithOry() {
    OAuth2Client.authenticate(DefaultOryAuthOptions)
    .then(response => this.data.emit(response.access_token_response))
  }
}
