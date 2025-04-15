import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultSourceTypeModel,
} from '../../../../assets/data/defaultConfig'
import { ConfigService } from '../../../core/services/config/config.service'
import { SubjectConfigService } from '../../../core/services/config/subject-config.service'
import { LogService } from '../../../core/services/misc/log.service'
import { TokenService } from '../../../core/services/token/token.service'
import { AnalyticsService } from '../../../core/services/usage/analytics.service'
import { OAuthToken } from '../../../shared/models/token'

@Injectable({
  providedIn: 'root'
})
export abstract class AuthService {
  private URI_base: string

  constructor(
    public http: HttpClient,
    public token: TokenService,
    public config: ConfigService,
    public logger: LogService,
    public analytics: AnalyticsService,
    public subjectConfig: SubjectConfigService
  ) { }

  abstract authenticate(authObj: any): Promise<any>

  protected completeAuthentication(refreshToken: string, baseUrl: string, tokenEndpoint: string): Promise<OAuthToken> {
    return this.token.setURI(baseUrl)
      .then(() => this.analytics.setUserProperties({ baseUrl }))
      .then(() => this.token.setTokenEndpoint(tokenEndpoint))
      .then(() => this.token.register(this.token.getRefreshParams(refreshToken)))
      .then(() => this.registerAsSource())
      .then(() => this.token.refresh())
  }

  reset() {
    this.config.resetAll()
  }

  initSubjectInformation() {
    return Promise.all([
      this.token.getURI(),
      this.subjectConfig.pullSubjectInformation()
    ]).then(([baseUrl, subjectInformation]) => {
      const config = {
        projectId: subjectInformation.project.projectName,
        subjectId: subjectInformation.login,
        sourceId: this.getSourceId(subjectInformation),
        humanReadableId: subjectInformation.externalId,
        enrolmentDate: new Date(subjectInformation.createdDate).getTime(),
        baseUrl,
        attributes: subjectInformation.attributes
      }
      return this.config.setAll(config)
    })
  }

  private getSourceId(response: any): string {
    const source = response.sources.find(
      s => s.sourceTypeModel === DefaultSourceTypeModel
    )
    return source ? source.sourceId : 'Device not available'
  }

  private registerAsSource() {
    return this.subjectConfig.registerSourceToSubject()
  }
}
