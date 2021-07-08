import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { GithubContent } from '../../../shared/models/github'
import { Utility } from '../../../shared/utilities/util'
import { AppServerService } from '../app-server/app-server.service'

@Injectable()
export class GithubClient {
  constructor(
    private appServerService: AppServerService,
    private util: Utility,
    private http: HttpClient
  ) {}

  getRaw(url): Promise<any> {
    return this.appServerService.fetchFromGithub(url).catch(e => {
      if (e.status == 404) return this.http.get(url).toPromise()
      else throw e
    })
  }

  getContent(url): Promise<any> {
    return this.getRaw(url).then((res: GithubContent) => {
      return JSON.parse(this.util.base64ToUnicode(res.content))
    })
  }
}
