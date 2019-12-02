import { Injectable } from '@angular/core'
import { HTTP } from '@ionic-native/http/ngx'

import { DefaultRequestEncodedContentType } from '../../../../assets/data/defaultConfig'

@Injectable()
export class HttpNativeService {
  constructor(public http: HTTP) {}

  public get(url: string, params?: any, options?): Promise<Object> {
    if (!options) options = {}

    return this.http
      .get(url, params, options)
      .then(res =>
        options.responseType == 'text' ? res.data : JSON.parse(res.data)
      )
  }

  public post(url: string, params?: any, options?): Promise<Object> {
    if (!options) options = {}
    if (options['Content-Type'] == DefaultRequestEncodedContentType)
      this.http.setDataSerializer('urlencoded')
    else this.http.setDataSerializer('json')

    return this.http
      .post(url, params, options)
      .then(res =>
        options.responseType == 'text' ? res.data : JSON.parse(res.data)
      )
  }
}
