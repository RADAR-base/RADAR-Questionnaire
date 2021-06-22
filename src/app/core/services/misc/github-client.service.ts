import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { DefaultGithubToken } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { GithubContent } from '../../../shared/models/github'
import { RemoteConfigService } from '../config/remote-config.service'

@Injectable()
export class GithubClientService {
  constructor(
    private http: HttpClient,
    private remoteConfig: RemoteConfigService
  ) {}

  get(url): Promise<any> {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(ConfigKeys.GITHUB_API_TOKEN, DefaultGithubToken)
      )
      .then(token =>
        this.http
          .get(url, {
            headers: new HttpHeaders().set('Authorization', 'Bearer ' + token)
          })
          .toPromise()
      )
  }

  getContent(url): Promise<any> {
    return this.get(url).then((res: GithubContent) => {
      const parsed = JSON.parse(atob(res.content))
      if (!(parsed instanceof Array))
        throw new Error('URL does not contain an array of questions')
      return parsed
    })
  }
}
