import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultProtocolBranch,
  DefaultProtocolEndPoint,
  DefaultProtocolGithubRepo,
  DefaultProtocolPath,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI,
  GIT_API_URI
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { Assessment } from '../../../shared/models/assessment'
import { LogService } from '../misc/log.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ProtocolService {
  GIT_TREE = 'tree'
  GIT_BRANCHES = 'branches'
  ATTRIBUTE_KEY = 0
  ATTRIBUTE_VAL = 1

  constructor(
    private config: SubjectConfigService,
    private http: HttpClient,
    private remoteConfig: RemoteConfigService,
    private logger: LogService
  ) {}

  pull() {
    return Promise.all([
      this.getProjectTree(),
      this.config.getParticipantAttributes()
    ])
      .then(([tree, attributes]) =>
        this.findValidProtocolUrl(tree, [], this.ATTRIBUTE_KEY, '', attributes)
      )
      .then((url: string) => this.http.get(url).toPromise())
      .then(res => atob(res['content']))
  }

  findValidProtocolUrl(children, previousPath, findNext, protocol, attributes) {
    if (findNext == this.ATTRIBUTE_KEY)
      protocol = this.getProtocolPathInTree(children, DefaultProtocolPath)
    return new Promise(resolve => {
      const selected = this.matchTreeWithAttributes(
        children,
        findNext,
        attributes,
        previousPath
      )
      if (selected == null) resolve(protocol)
      else {
        findNext = !findNext
        this.getChildTree(selected).then(nextChildren =>
          resolve(
            this.findValidProtocolUrl(
              nextChildren['tree'],
              selected['path'],
              findNext,
              protocol,
              attributes
            )
          )
        )
      }
    })
  }

  getProtocolPathInTree(children, protocolPath) {
    const child = children.find(c => c.path == protocolPath).url
    if (child != null) return child
  }

  getChildTree(child) {
    return this.http.get(child['url']).toPromise()
  }

  matchTreeWithAttributes(children, findNext, attributes, previousPath) {
    if (findNext == this.ATTRIBUTE_KEY) {
      for (const child in children)
        if (Object.keys(attributes).includes(child['path'])) return child
    } else {
      for (const child in children)
        if (child['path'] == attributes[previousPath]) return child
    }
  }

  getProjectTree() {
    return this.readRemoteConfig()
      .then(cfg =>
        Promise.all([this.config.getProjectName(), this.getProtocolBranch(cfg)])
      )
      .then(([projectName, branch]) =>
        this.getRootTreeHashUrl(branch)
          .then(url => this.http.get(url).toPromise())
          .then((res: any) => {
            const project = res.tree.find(
              c => c.path == projectName && c.type == this.GIT_TREE
            )
            if (project == null)
              throw new Error('Unable to find project in repository.')
            return this.http.get(project.url).toPromise()
          })
          .then(projectChild => projectChild['tree'])
      )
  }

  getRootTreeHashUrl(branch) {
    const treeUrl = [
      GIT_API_URI,
      DefaultProtocolGithubRepo,
      this.GIT_BRANCHES,
      branch
    ].join('/')
    return this.http
      .get(treeUrl)
      .toPromise()
      .then((res: any) => res.commit.commit.tree.url)
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
