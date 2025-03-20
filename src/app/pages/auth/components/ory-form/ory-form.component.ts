import { Component, EventEmitter, Input, Output } from '@angular/core'
import { OAuth2Client } from '@byteowls/capacitor-oauth2';
import { DefaultOryAuthOptions } from '../../../../../assets/data/defaultConfig'

@Component({
  selector: 'ory-form',
  templateUrl: 'ory-form.component.html',
  styleUrls: ['ory-form.component.scss']
})
export class OryFormComponent {
  @Input()
  loading: boolean
  @Input()
  baseUrl: string

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor() { }

  loginWithOry() {
    DefaultOryAuthOptions.authorizationBaseUrl = this.baseUrl + '/hydra/oauth2/auth'
    DefaultOryAuthOptions.accessTokenEndpoint = this.baseUrl + '/hydra/oauth2/token'
    OAuth2Client.authenticate(DefaultOryAuthOptions)
      .then(response => {
        const data = Object.assign({}, response.access_token_response, { url: this.baseUrl })
        return this.data.emit(data)
      })
  }
}
