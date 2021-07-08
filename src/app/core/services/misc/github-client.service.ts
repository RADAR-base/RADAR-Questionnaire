import { Injectable } from '@angular/core'

import { GithubContent } from '../../../shared/models/github'
import { Utility } from '../../../shared/utilities/util'
import { AppServerService } from '../app-server/app-server.service'

@Injectable()
export class GithubClient {
  constructor(
    private appServerService: AppServerService,
    private util: Utility
  ) {}

  getRaw(url): Promise<any> {
    return this.appServerService.fetchFromGithub(url)
  }

  getContent(url): Promise<any> {
    return this.getRaw(url).then((res: GithubContent) => {
      return JSON.parse(this.util.base64ToUnicode(res.content))
    })
  }
}
