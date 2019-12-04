import { Injectable } from '@angular/core'
import { HTTP } from '@ionic-native/http/ngx'

import { DefaultRequestEncodedContentType } from '../../../../assets/data/defaultConfig'

@Injectable()
export class HttpNativeService {
  constructor(public http: HTTP) {}

  public get<T>(url: string, params?: any, headers?): Promise<T> {
    if (!headers) headers = {}

    return this.http
      .get(url, params, headers)
      .then(res =>
        headers.responseType == 'text' ? res.data : JSON.parse(res.data)
      )
  }

  public post<T>(url: string, data?: any, headers?): Promise<T> {
    if (!headers) headers = {}
    if (headers['Content-Type'] == DefaultRequestEncodedContentType)
      this.http.setDataSerializer('urlencoded')
    else this.http.setDataSerializer('json')

    return this.http
      .post(url, data, headers)
      .then(res =>
        headers.responseType == 'text' ? res.data : JSON.parse(res.data)
      )
  }

  public delete<T>(url: string, params?: any, headers?): Promise<T> {
    return this.http
      .delete(url, params, headers)
      .then(res =>
        headers.responseType == 'text' ? res.data : JSON.parse(res.data)
      )
  }
}
