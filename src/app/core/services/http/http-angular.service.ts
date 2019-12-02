import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { DefaultRequestEncodedContentType } from '../../../../assets/data/defaultConfig'

@Injectable()
export class HttpAngularService {
  constructor(public http: HttpClient) {}

  public get(url: string, params?: any, options?) {
    if (!options) options = {}
    options.params = params

    return this.http.get(url, { headers: options }).toPromise()
  }

  public post(url: string, params?: any, options?) {
    if (!options) options = {}
    const body =
      options['Content-Type'] == DefaultRequestEncodedContentType
        ? this.convertToSearchParams(params).toString()
        : params

    return this.http.post(url, body, { headers: options }).toPromise()
  }

  private convertToSearchParams(params: any) {
    const searchParams = new URLSearchParams()
    for (const k in params) {
      if (params.hasOwnProperty(k)) {
        searchParams.set(k, params[k])
      }
    }
    return searchParams
  }
}
