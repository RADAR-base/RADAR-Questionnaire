import { Component, EventEmitter, Input, Output } from '@angular/core'
import { OAuth2Client } from '@byteowls/capacitor-oauth2';
import {
  DefaultOryAuthOptions, DefaultOryEndpoint
} from '../../../../../assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service';
import { ConfigKeys } from 'src/app/shared/enums/config';
import { AnalyticsService } from 'src/app/core/services/usage/analytics.service';

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

  HYDRA_AUTH_ENDPOINT = '/hydra/oauth2/auth'
  HYDRA_TOKEN_ENDPOINT = '/hydra/oauth2/token'

  constructor(
    private remoteConfig: RemoteConfigService,
    private analytics: AnalyticsService
  ) { }

  loginWithOry() {
    this.analytics.setUserProperties({ studyCode: this.studyId })
      .then(() =>
        this.remoteConfig
          .forceFetch()
          .then(config =>
            config.getOrDefault(
              ConfigKeys.PLATFORM_URL,
              DefaultOryEndpoint
            )
          ).then(baseUrl => {
            DefaultOryAuthOptions.authorizationBaseUrl = baseUrl + this.HYDRA_AUTH_ENDPOINT
            DefaultOryAuthOptions.accessTokenEndpoint = baseUrl + this.HYDRA_TOKEN_ENDPOINT
            OAuth2Client.authenticate(DefaultOryAuthOptions)
              .then(response => {
                const data = Object.assign({}, response.access_token_response, { url: baseUrl })
                return this.data.emit(data)
              })
          })
      )
  }
}
