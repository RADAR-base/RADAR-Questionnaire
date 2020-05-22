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
  ATTRIBUTE_KEY = 'key'
  ATTRIBUTE_VAL = 'val'

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
        this.findValidProtocol(tree, [], this.ATTRIBUTE_KEY, '', attributes)
      )
      .then((url: string) =>
        this.http
          .get(url)
          .toPromise()
          .then(res => atob(res['content']))
      )
  }

  findValidProtocol(children, paths, findNext, protocol, attributes) {
    if (
      findNext == this.ATTRIBUTE_KEY &&
      children.map(c => c.path).includes(DefaultProtocolPath)
    )
      protocol = children.find(c => c.path == DefaultProtocolPath).url
    return new Promise(resolve => {
      let selected
      let childTreeUrl = ''
      if (findNext == this.ATTRIBUTE_KEY) {
        findNext = this.ATTRIBUTE_VAL
        for (const child in children) {
          if (Object.keys(attributes).includes(child['path'])) selected = child
        }
      } else {
        findNext = this.ATTRIBUTE_KEY
        const lastKey = paths[paths.length - 1]
        for (const child in children) {
          if (child['path'] == attributes[lastKey]) selected = child
        }
      }
      if (selected == null) {
        resolve(protocol)
      } else {
        paths.push(selected['path'])
        childTreeUrl = selected['url']
        this.http
          .get(childTreeUrl)
          .toPromise()
          .then((nextChildren: any) => {
            resolve(
              this.findValidProtocol(
                nextChildren.tree,
                paths,
                findNext,
                protocol,
                attributes
              )
            )
          })
      }
    })
  }

  getProjectTree() {
    return this.readRemoteConfig()
      .then(cfg =>
        Promise.all([this.config.getProjectName(), this.getProtocolBranch(cfg)])
      )
      .then(([projectName, branch]) => {
        return this.getGitRootTreeHashUrl(branch)
          .then(url => this.http.get(url).toPromise())
          .then((res: any) => {
            const project = res.tree.find(
              c => c.path == projectName && c.type == this.GIT_TREE
            )
            if (project == null)
              throw new Error('Unable to find project in repository.')
            return this.http.get(project.url).toPromise()
          })
          .then((projectChild: any) => {
            return projectChild.tree
          })
      })
  }

  getGitRootTreeHashUrl(branch) {
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
