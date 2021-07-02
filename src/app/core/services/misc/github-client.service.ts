import { Injectable } from '@angular/core'

import { GithubContent } from '../../../shared/models/github'
import { AppServerService } from '../app-server/app-server.service'

@Injectable()
export class GithubClient {
  constructor(private appServerService: AppServerService) {}

  getRaw(url): Promise<any> {
    return this.appServerService.fetchFromGithub(url)
  }

  getContent(url): Promise<any> {
    return this.getRaw(url).then((res: GithubContent) => {
      return JSON.parse(atob(res.content))
    })
  }
}
