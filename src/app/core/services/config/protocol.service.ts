import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultProtocolEndPoint,
  DefaultProtocolURI,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI
} from '../../../../assets/data/defaultConfig'
import { Assessment } from '../../../shared/models/assessment'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ProtocolService {
  constructor(private config: SubjectConfigService, private http: HttpClient) {}

  pull() {
    return this.config.getProjectName().then(projectName => {
      if (projectName) {
        const URI = DefaultProtocolEndPoint + projectName + DefaultProtocolURI
        return this.http.get(URI, { responseType: 'text' }).toPromise()
      } else {
        console.error(
          'Unknown project name : ' + projectName + '. Cannot pull protocols.'
        )
      }
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
