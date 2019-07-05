import {
  DefaultProtocolEndPoint,
  DefaultProtocolPath,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI
} from '../../../../assets/data/defaultConfig'

import { Assessment } from '../../../shared/models/assessment'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ProtocolService {
  constructor(private config: SubjectConfigService, private http: HttpClient) {}

  pull() {
    return this.config.getProjectName().then(projectName => {
      if (!projectName) {
        console.error(
          'Unknown project name : ' + projectName + '. Cannot pull protocols.'
        )
        return Promise.reject()
      }
      const URI = [
        DefaultProtocolEndPoint,
        projectName,
        DefaultProtocolPath
      ].join('/')
      return this.http
        .get(URI)
        .toPromise()
        .then(res => atob(res['content']))
    })
  }

  format(protocols: Assessment[]): Assessment[] {
    return protocols.map(p => {
      p.questionnaire.type = DefaultQuestionnaireTypeURI
      p.questionnaire.format = DefaultQuestionnaireFormatURI
      return p
    })
  }
}
