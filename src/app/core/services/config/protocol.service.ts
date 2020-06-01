// tslint:disable: forin
// tslint:disable: no-bitwise
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import {
  DefaultParticipantAttributeOrder,
  DefaultProtocolBranch,
  DefaultProtocolGithubRepo,
  DefaultProtocolPath,
  DefaultQuestionnaireFormatURI,
  DefaultQuestionnaireTypeURI,
  GIT_API_URI
} from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { Assessment } from '../../../shared/models/assessment'
import { Attributes } from '../../../shared/models/attribute'
import {
  GithubContent,
  GithubTree,
  GithubTreeChild
} from '../../../shared/models/github'
import { sortObject } from '../../../shared/utilities/sort-object'
import { LogService } from '../misc/log.service'
import { RemoteConfigService } from './remote-config.service'
import { SubjectConfigService } from './subject-config.service'

@Injectable()
export class ProtocolService {
  GIT_TREE = 'tree'
  GIT_BRANCHES = 'branches'
  ATTRIBUTE_KEY = 0
  ATTRIBUTE_VAL = 1
  DEFAULT_ATTRIBUTE_ORDER = Number.MAX_SAFE_INTEGER

  constructor(
    private config: SubjectConfigService,
    private http: HttpClient,
    private remoteConfig: RemoteConfigService,
    private logger: LogService
  ) {}

  pull() {
    return Promise.all([this.getProjectTree(), this.getParticipantAttributes()])
      .then(([tree, attributes]) =>
        this.findValidProtocolUrl(tree, '', this.ATTRIBUTE_KEY, '', attributes)
      )
      .then((url: string) => this.http.get(url).toPromise())
      .then((res: GithubContent) => atob(res.content))
  }

  /**
   * This function retrieves a valid protocol url that matches the most number of attributes
   * based on attribute order. This is done by traversing the Github tree recursively until the
   * children contain no matching user attributes.
   *
   * First, it checks if any of the children is a protocol.json file and stores it to `protocolURL`.
   * Next, it matches any of the children with any of the user attribute keys based on the order/priority.
   * If there is no match, it will return the `protocolURL` set earlier.
   * If there is a match, it will run the same function recursively for the children of that new tree,
   *  but this time searching for the matching attribute value.
   * This will keep repeating and alternating between key and value until no match is found,
   *  and the protocol url is returned.
   *
   *  @param children : children (blobs or trees) of the Github tree (of that path).
   *                  : The initial value is the children of of the project tree (`repo/project-name`).
   *  @param previousPath : path that was last traversed.
   *                  : The initial value is an empty string
   *  @param findNext : If the path to find next is the attribute key or value.
   *                  : The format is `project-name/attribute-key/attribute-value/attribute-key-2/attribute-value-2/..`
   *                  : The initial value is `ATTRIBUTE_KEY`
   *  @param protocolURL : The protocol url, if it exists, in the path (`path/protocol.json`).
   *                     : The initial value is an empty string
   *  @param attributes : A key-value pairs of the user's attributes.
   *                    : This value is constant throughout the recursion
   */
  findValidProtocolUrl(
    children: GithubTreeChild[],
    previousPath: string,
    findNext: number,
    protocolURL: string,
    attributes: Attributes
  ) {
    if (findNext == this.ATTRIBUTE_KEY)
      protocolURL = this.getProtocolPathInTree(children, DefaultProtocolPath)
    return new Promise(resolve => {
      const selected = this.matchTreeWithAttributes(
        children,
        findNext,
        attributes,
        previousPath
      )
      if (selected == null) resolve(protocolURL)
      else {
        findNext = ~findNext
        this.getChildTree(selected).then(nextChildren =>
          resolve(
            this.findValidProtocolUrl(
              nextChildren.tree,
              selected.path,
              findNext,
              protocolURL,
              attributes
            )
          )
        )
      }
    })
  }

  getProtocolPathInTree(children: GithubTreeChild[], protocolPath: string) {
    const child = children.find(c => c.path == protocolPath).url
    if (child != null) return child
  }

  getChildTree(child: GithubTreeChild): Promise<GithubTree> {
    return this.http.get<GithubTree>(child.url).toPromise()
  }

  matchTreeWithAttributes(
    children: GithubTreeChild[],
    findNext: number,
    attributes: Attributes,
    previousPath: string
  ): GithubTreeChild {
    if (findNext == this.ATTRIBUTE_KEY) {
      for (const attribute in attributes) {
        const child = children.find(c => c.path == attribute)
        if (child != null) return child
      }
    } else {
      for (const child of children)
        if (child.path == attributes[previousPath]) return child
    }
    return null
  }

  getProjectTree(): Promise<GithubTreeChild[]> {
    return this.readRemoteConfig()
      .then(cfg =>
        Promise.all([
          this.config.getProjectName(),
          this.getProtocolBranch(cfg),
          this.getProtocolRepo
        ])
      )
      .then(([projectName, branch, repo]) =>
        this.getRootTreeHashUrl(branch, repo)
          .then(url => this.http.get(url).toPromise())
          .then((res: GithubTree) => {
            const project = res.tree.find(c => c.path == projectName)
            if (project == null)
              throw new Error('Unable to find project in repository.')
            return this.http.get<GithubTree>(project.url).toPromise()
          })
      )
      .then(projectChild => projectChild.tree)
  }

  getRootTreeHashUrl(branch, repo) {
    const treeUrl = [GIT_API_URI, repo, this.GIT_BRANCHES, branch].join('/')
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
        const orderWithoutNull = this.formatAttributeOrder(attributes, order)
        if (attributes == null)
          return this.config.pullSubjectInformation().then(user => {
            this.config.setParticipantAttributes(user.attributes)
            return sortObject(user.attributes, orderWithoutNull)
          })
        else return sortObject(attributes, orderWithoutNull)
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

  format(protocols: Assessment[]): Assessment[] {
    return protocols.map(p => {
      p.questionnaire.type = DefaultQuestionnaireTypeURI
      p.questionnaire.format = DefaultQuestionnaireFormatURI
      return p
    })
  }
}
