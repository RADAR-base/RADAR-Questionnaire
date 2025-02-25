// tslint:disable: forin
import { Injectable } from '@angular/core'

import {
  DefaultParticipantAttributeOrder,
  DefaultProtocolBranch,
  DefaultProtocolGithubRepo,
  DefaultProtocolPath,
  GIT_API_URI
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import {
  GithubContent,
  GithubTree,
  GithubTreeChild
} from '../../../shared/models/github'
import { ProtocolMetaData } from '../../../shared/models/protocol'
import { sortObject } from '../../../shared/utilities/sort-object'
import { Utility } from '../../../shared/utilities/util'
import { GithubClient } from '../misc/github-client.service'
import { LogService } from '../misc/log.service'
import { AnalyticsService } from '../usage/analytics.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ProtocolService {
  GIT_TREE = 'tree'
  GIT_BRANCHES = 'branches'
  DEFAULT_ATTRIBUTE_ORDER = Number.MAX_SAFE_INTEGER

  constructor(
    private config: SubjectConfigService,
    private githubClient: GithubClient,
    private remoteConfig: RemoteConfigService,
    private logger: LogService,
    private analytics: AnalyticsService,
    private util: Utility
  ) { }

  pull(): Promise<ProtocolMetaData> {
    return Promise.all([this.getProjectTree(), this.getParticipantAttributes()])
      .then(([tree, attributes]: [GithubTreeChild[], any]) =>
        this.findValidProtocolUrl(
          tree,
          new Map(Object.entries(attributes))
        ).catch(() => this.getProtocolPathInTree(tree, DefaultProtocolPath))
      )
      .then((url: string) => this.githubClient.getRaw(url))
      .then((res: GithubContent) => ({
        protocol: this.util.base64ToUnicode(res.content),
        url: res.url
      }))
  }

  /**
   * This function retrieves a valid protocol url that matches the most number of attributes
   * based on attribute order. This is done by traversing the Github tree for the attribute key first
   * the the attribute value.
   *
   * First, it matches any of the children with any of the user attribute keys based on the order/priority.
   * Next, it will check for matches of the attribute value for the children of that new tree,
   *  but this time searching for the matching attribute value.
   * Then, it will check for matches of the `protocol.json` file. Finally, returning this url.
   *
   *  @param children : The children (blobs or trees) of of the project tree (`repo/project-name`).
   *  @param attributes : A key-value pairs of the user's attributes.
   */
  findValidProtocolUrl(
    children: GithubTreeChild[],
    attributes: Map<String, String>
  ): Promise<String> {
    const keyTree = this.matchTreeWithAttributeKey(children, attributes)
    if (!keyTree) return Promise.reject()
    return this.getChildTree(keyTree).then(keyChildren => {
      const valueTree = this.matchTreeWithAttributeValue(
        keyChildren.tree,
        attributes,
        keyTree.path
      )
      if (!valueTree) return Promise.reject()
      return this.getChildTree(valueTree).then(valChildren =>
        this.getProtocolPathInTree(valChildren.tree, DefaultProtocolPath)
      )
    })
  }

  getProtocolPathInTree(children: GithubTreeChild[], protocolPath: string) {
    const child = children.find(c => c.path == protocolPath).url
    if (child != null) return child
  }

  getChildTree(child: GithubTreeChild): Promise<GithubTree> {
    return this.githubClient.getRaw(child.url) as Promise<GithubTree>
  }

  matchTreeWithAttributeKey(
    children: GithubTreeChild[],
    attributes: Map<String, String>
  ): GithubTreeChild {
    for (const [key, val] of attributes) {
      const child = children.find(c => c.path == key)
      if (child != null) return child
    }
    return null
  }

  matchTreeWithAttributeValue(
    children: GithubTreeChild[],
    attributes: Map<String, String>,
    key: string
  ): GithubTreeChild {
    for (const child of children)
      if (child.path == attributes.get(key)) return child
    return null
  }

  getProjectTree(): Promise<GithubTreeChild[]> {
    return Promise.all([
      this.config.getProjectName(),
      this.getRootTreeHashUrl()
    ])
      .then(([projectName, url]) =>
        this.githubClient.getRaw(url).then((res: GithubTree) => {
          const project = res.tree.find(c => c.path == projectName)
          if (project == null || project == undefined)
            throw new Error('Unable to find project in repository.')
          return this.githubClient.getRaw(project.url) as Promise<GithubTree>
        })
      )
      .then(projectChild => projectChild.tree)
  }

  getRootTreeHashUrl() {
    return this.readRemoteConfig()
      .then(cfg =>
        Promise.all([this.getProtocolBranch(cfg), this.getProtocolRepo(cfg)])
      )
      .then(([branch, repo]) => {
        const treeUrl = [GIT_API_URI, repo, this.GIT_BRANCHES, branch].join('/')
        return this.githubClient
          .getRaw(treeUrl)
          .then((res: any) => res.commit.commit.tree.url)
      })
  }

  readRemoteConfig() {
    return this.remoteConfig.read().catch(e => {
      throw this.logger.error('Failed to fetch Firebase config', e)
    })
  }

  getProtocolBranch(config) {
    return config.getOrDefault(
      ConfigKeys.PROTOCOL_BRANCH,
      DefaultProtocolBranch
    )
  }

  getProtocolRepo(config) {
    return config.getOrDefault(
      ConfigKeys.PROTOCOL_REPO,
      DefaultProtocolGithubRepo
    )
  }

  getParticipantAttributeOrder(config) {
    return config.getOrDefault(
      ConfigKeys.PARTICIPANT_ATTRIBUTE_ORDER,
      DefaultParticipantAttributeOrder
    )
  }

  getParticipantAttributes() {
    return this.readRemoteConfig()
      .then(cfg =>
        Promise.all([
          this.config.getParticipantAttributes(),
          this.getParticipantAttributeOrder(cfg)
        ])
      )
      .then(([attributes, order]) => {
        return sortObject(
          attributes,
          this.formatAttributeOrder(attributes, order)
        )
      })
  }

  /**
   * This maps the attribute keys to their order (from order object) and sets it to the max int if null.
   */
  formatAttributeOrder(attributes, order) {
    const orderWithoutNull = {}
    Object.keys(attributes).map(
      k =>
      (orderWithoutNull[k] =
        order[k] != null ? order[k] : this.DEFAULT_ATTRIBUTE_ORDER)
    )
    return orderWithoutNull
  }
}
