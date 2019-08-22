import 'rxjs/add/operator/toPromise'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultManagementPortalURI,
  DefaultMetaTokenURI,
  DefaultRefreshTokenRequestBody,
  DefaultRequestEncodedContentType,
  DefaultRequestJSONContentType,
  DefaultSourceTypeModel,
  DefaultSourceTypeRegistrationBody,
  DefaultSubjectsURI
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { TokenService } from '../../../core/services/token/token.service'
import { MetaToken } from '../../../shared/models/token'
import { isValidURL } from '../../../shared/utilities/form-validators'

@Injectable()
export class AuthService {
  URI_base: string

  constructor(
    public http: HttpClient,
    private token: TokenService,
    private config: ConfigService,
    private logger: LogService
  ) {}

  authenticate(authObj) {
    return (isValidURL(authObj)
      ? this.URLAuth(authObj)
      : this.nonURLAuth(authObj)
    ).then(refreshToken => {
      return this.registerToken(refreshToken)
        .then(() => this.registerAsSource())
        .then(() => this.registerToken(refreshToken))
    })
  }

  URLAuth(authObj) {
    // NOTE: Meta QR code and new QR code
    return this.getRefreshTokenFromUrl(authObj).then((body: any) => {
      this.logger.log(`Retrieved refresh token from ${body.baseUrl}`, body)
      const refreshToken = body.refreshToken
      return this.token
        .setURI(body.baseUrl)
        .catch()
        .then(() => this.updateURI())
        .then(() => refreshToken)
    })
  }

  nonURLAuth(authObj) {
    // NOTE: Old QR codes: containing refresh token as JSON
    return this.updateURI().then(() => JSON.parse(authObj).refreshToken)
  }

  updateURI() {
    return this.token.getURI().then(uri => {
      this.URI_base = uri + DefaultManagementPortalURI
    })
  }

  registerToken(registrationToken): Promise<void> {
    const refreshBody = DefaultRefreshTokenRequestBody + registrationToken
    return this.token.register(refreshBody)
  }

  getRefreshTokenFromUrl(url): Promise<MetaToken> {
    return this.http.get(url).toPromise()
  }

  getSubjectURI(subject) {
    return this.URI_base + DefaultSubjectsURI + subject
  }

  getSubjectInformation() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestEncodedContentType),
      this.token.getDecodedSubject()
    ]).then(([headers, subject]) =>
      this.http.get(this.getSubjectURI(subject), { headers }).toPromise()
    )
  }

  initSubjectInformation() {
    return this.getSubjectInformation().then(res => {
      const subjectInformation: any = res
      const participantId = subjectInformation.externalId
      const participantLogin = subjectInformation.login
      const projectName = subjectInformation.project.projectName
      const sourceId = this.getSourceId(subjectInformation)
      const createdDate = new Date(subjectInformation.createdDate).getTime()
      return this.config.setAll(
        participantId,
        participantLogin,
        projectName,
        sourceId,
        createdDate
      )
    })
  }

  getSourceId(response) {
    const sources = response.sources
    for (let i = 0; i < sources.length; i++) {
      if (sources[i].sourceTypeModel === DefaultSourceTypeModel) {
        return sources[i].sourceId
      }
    }
    return 'Device not available'
  }

  registerAsSource() {
    return Promise.all([
      this.token.getAccessHeaders(DefaultRequestJSONContentType),
      this.token.getDecodedSubject()
    ]).then(([headers, subject]) =>
      this.http
        .post(
          this.getSubjectURI(subject) + '/sources',
          DefaultSourceTypeRegistrationBody,
          {
            headers
          }
        )
        .toPromise()
    )
  }
}
