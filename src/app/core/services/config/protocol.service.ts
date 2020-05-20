import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultProtocolBranch,
  DefaultProtocolEndPoint,
  DefaultProtocolPath,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { Assessment } from '../../../shared/models/assessment'
import { LogService } from '../misc/log.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ProtocolService {
  ATTRIBUTE_DELIMITER = '#'

  constructor(
    private config: SubjectConfigService,
    private http: HttpClient,
    private remoteConfig: RemoteConfigService,
    private logger: LogService
  ) {}

  pull() {
    return this.config
      .getParticipantAttributes()
      .then(attributes => this.pullValidProtocolUrlResult(attributes))
      .then(res => atob(res['content']))
  }

  pullValidProtocolUrlResult(attributes) {
    const powerset = this.getAllAttributeSubsets(attributes)
    return new Promise((resolve, reject) => {
      for (let iter = powerset.length - 1; iter >= 0; iter--) {
        this.createProtocolUrl(this.formatAttributes(powerset[iter]))
          .then(URI => this.http.get(URI).toPromise())
          .then(res => {
            if (res['content']) resolve(res)
          })
      }
      reject('No valid protocol found.')
    })
  }

  getAllAttributeSubsets(attributes) {
    const array = Object.entries(attributes)
    const result = array.reduce(
      (subsets, value) => subsets.concat(subsets.map(set => [...set, value])),
      [[]]
    )
    return result
  }

  formatAttributes(attributes: any[]) {
    if (!attributes || !attributes.length) return ''
    return attributes
      .reduce((acc, val) => acc.concat(val), [])
      .join(this.ATTRIBUTE_DELIMITER)
  }

  createProtocolUrl(attributes?) {
    return this.readRemoteConfig()
      .then(cfg =>
        Promise.all([
          this.config.getProjectName(),
          this.getBaseUrl(cfg),
          this.getProtocolPath(cfg),
          this.getProtocolBranch(cfg)
        ])
      )
      .then(([projectName, baseUrl, path, branch]) => {
        if (!projectName)
          throw new Error('Project name is not set. Cannot pull protocols.')
        console.log(attributes)
        if (attributes) projectName = projectName + '#' + attributes
        return [baseUrl, projectName, `${path}?ref=${branch}`].join('/')
      })
  }

  readRemoteConfig() {
    return this.remoteConfig.read().catch(e => {
      throw this.logger.error('Failed to fetch Firebase config', e)
    })
  }

  getBaseUrl(config) {
    return config.getOrDefault(
      ConfigKeys.PROTOCOL_BASE_URL,
      DefaultProtocolEndPoint
    )
  }

  getProtocolPath(config) {
    return config.getOrDefault(ConfigKeys.PROTOCOL_PATH, DefaultProtocolPath)
  }

  getProtocolBranch(config) {
    return config.getOrDefault(
      ConfigKeys.PROTOCOL_BRANCH,
      DefaultProtocolBranch
    )
  }

  format(protocols: Assessment[]): Assessment[] {
    return protocols.map(p => {
      p.questionnaire.type = DefaultQuestionnaireTypeURI
      p.questionnaire.format = DefaultQuestionnaireFormatURI
      return p
    })
  }
}
