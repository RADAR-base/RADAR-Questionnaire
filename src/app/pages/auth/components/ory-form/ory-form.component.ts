import { Component, EventEmitter, Input, Output } from '@angular/core'
import { GenericOAuth2 } from '@capacitor-community/generic-oauth2'

import {
  DefaultHydraAuthEndpoint,
  DefaultHydraTokenEndpoint,
  DefaultOryAuthOptions
} from '../../../../../assets/data/defaultConfig'
import { RemoteConfigService } from 'src/app/core/services/config/remote-config.service'
import { ConfigKeys } from 'src/app/shared/enums/config'
import { AnalyticsService } from 'src/app/core/services/usage/analytics.service'
import { KeyboardEventType } from 'src/app/shared/enums/events'
import { isValidURL } from 'src/app/shared/utilities/form-validators'
import { LocalizationService } from 'src/app/core/services/misc/localization.service'
import { LocKeys } from 'src/app/shared/enums/localisations'
import { SubjectConfigService } from 'src/app/core/services/config/subject-config.service'

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
  @Output()
  focus: EventEmitter<any> = new EventEmitter<any>()
  @Output()
  errors: EventEmitter<any> = new EventEmitter<any>()

  studyId: String
  buttonHidden = false

  constructor(
    private remoteConfig: RemoteConfigService,
    private analytics: AnalyticsService,
    private localization: LocalizationService,
    private subjectConfig: SubjectConfigService
  ) {
    this.init()
  }

  init() {
    this.subjectConfig.getStudyCode().then(studyCode => {
      this.studyId = studyCode
    })
  }

  loginWithOry() {
    this.analytics.setUserProperties({ studyCode: this.studyId.toLowerCase() })
      .then(() =>
        this.remoteConfig
          .forceFetch()
          .then(config =>
            config.get(ConfigKeys.PLATFORM_URL)
          ).then(baseUrl => {
            if (!baseUrl || !isValidURL(baseUrl))
              return this.errors.emit({
                error: {
                  message: this.localization.translateKey(LocKeys.ENROL_REGISTRATION_ORY_INVALID_CODE)
                }
              })
            this.subjectConfig.setStudyCode(this.studyId.toLowerCase())
            DefaultOryAuthOptions.authorizationBaseUrl = baseUrl + DefaultHydraAuthEndpoint
            DefaultOryAuthOptions.accessTokenEndpoint = baseUrl + DefaultHydraTokenEndpoint
            GenericOAuth2.logout(DefaultOryAuthOptions).then(() => {
              GenericOAuth2.authenticate(DefaultOryAuthOptions)
                .then(() => GenericOAuth2.authenticate(DefaultOryAuthOptions)).then(response =>
                  this.data.emit(Object.assign({}, response.access_token_response, { url: baseUrl }))
                )
            })
          })
      )
  }

  onFocus(value: string) {
    this.focus.emit()
    setTimeout(() => this.buttonHidden = value === 'true', 200)
  }

  onKeyboardEvent(value) {
    value = value.toLowerCase()
    if (value == KeyboardEventType.ENTER)
      this.loginWithOry()
  }

}
