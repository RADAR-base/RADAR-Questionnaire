import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { DefaultGithubToken } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { GithubContent } from '../../../shared/models/github'
import { RemoteConfigService } from '../config/remote-config.service'
import { LogService } from './log.service'

@Injectable()
export class GithubClientService {
  constructor(
    private http: HttpClient,
    private remoteConfig: RemoteConfigService,
    private logger: LogService
  ) {}

  get(url): Promise<any> {
    return this.readRemoteConfig()
      .then(config =>
        config
          ? config.getOrDefault(ConfigKeys.GITHUB_API_TOKEN, DefaultGithubToken)
          : DefaultGithubToken
      )
      .then(token => {
        return this.http
          .get(url, {
            headers: token
              ? new HttpHeaders().set('Authorization', 'Bearer ' + token)
              : {}
          })
          .toPromise()
      })
  }

  getContent(url): Promise<any> {
    return this.get(url).then((res: GithubContent) => {
      const parsed = JSON.parse(atob(res.content))
      if (!(parsed instanceof Array))
        throw new Error('URL does not contain an array of questions')
      return parsed
    })
  }

  readRemoteConfig() {
    return this.remoteConfig.read().catch(e => {
      throw this.logger.error('Failed to fetch Firebase config', e)
    })
  }
}
