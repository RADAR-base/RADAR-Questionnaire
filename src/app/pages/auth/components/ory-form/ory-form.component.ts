import { Component, EventEmitter, Input, Output } from '@angular/core'
import { OAuth2Client } from '@byteowls/capacitor-oauth2';
import {
  DefaultOryAuthOptions, DefaultOryEndpoint
} from '../../../../../assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service';
import { ConfigKeys } from 'src/app/shared/enums/config';

@Component({
  selector: 'ory-form',
  templateUrl: 'ory-form.component.html',
  styleUrls: ['ory-form.component.scss']
})
export class OryFormComponent {
  @Input()
  loading: boolean
  @Input()
  studyId: string

  @Output()
  data: EventEmitter<any> = new EventEmitter<any>()

  constructor(private remoteConfig: RemoteConfigService) { }

  loginWithOry() {
    this.remoteConfig
      .forceFetch()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.PLATFORM_URL,
          DefaultOryEndpoint
        )
      ).then(baseUrl => {
        DefaultOryAuthOptions.authorizationBaseUrl = baseUrl + '/hydra/oauth2/auth'
        DefaultOryAuthOptions.accessTokenEndpoint = baseUrl + '/hydra/oauth2/token'
        OAuth2Client.authenticate(DefaultOryAuthOptions)
          .then(response => {
            const data = Object.assign({}, response.access_token_response, { url: baseUrl })
            return this.data.emit(data)
          })
      })

  }
}
