import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { DefaultGithubFetchStrategy } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import {
  GithubContent,
  GithubFetchStrategy
} from '../../../shared/models/github'
import { Utility } from '../../../shared/utilities/util'
import { AppServerService } from '../app-server/app-server.service'
import { RemoteConfigService } from '../config/remote-config.service'

@Injectable()
export class GithubClient {
  githubFetchStrategy: string

  constructor(
    private appServerService: AppServerService,
    private util: Utility,
    private http: HttpClient,
    private remoteConfig: RemoteConfigService
  ) {}

  getRaw(url): Promise<any> {
    return this.getFetchStrategy().then(strategy => {
      switch (strategy) {
        case GithubFetchStrategy.APP_SERVER:
          return this.appServerService.fetchFromGithub(url)
        default:
          return this.http.get(url).toPromise()
      }
    })
  }

  getContent(url): Promise<any> {
    return this.getRaw(url).then((res: GithubContent) => {
      return JSON.parse(this.util.base64ToUnicode(res.content))
    })
  }

  getFetchStrategy(): Promise<String> {
    if (!this.githubFetchStrategy)
      return this.remoteConfig
        .read()
        .then(config =>
          config.getOrDefault(
            ConfigKeys.GITHUB_FETCH_STRATEGY,
            DefaultGithubFetchStrategy
          )
        )
        .then(strategy => {
          this.githubFetchStrategy = strategy
          return strategy
        })
    else return Promise.resolve(this.githubFetchStrategy)
  }
}
