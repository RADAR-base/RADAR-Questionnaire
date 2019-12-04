import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { DefaultRequestEncodedContentType } from '../../../../assets/data/defaultConfig'

@Injectable()
export class HttpAngularService {
  constructor(public http: HttpClient) {}

  public get<T>(url: string, params?: any, headers?): Promise<T> {
    if (!headers) headers = {}
    const options = { headers, params }
    console.log(options)

    return this.http.get<T>(url, options).toPromise()
  }

  public post<T>(url: string, data?: any, headers?): Promise<T> {
    if (!headers) headers = {}
    const body =
      headers['Content-Type'] == DefaultRequestEncodedContentType
        ? this.convertToSearchParams(data).toString()
        : data
    const options = { headers }

    return this.http.post<T>(url, body, options).toPromise()
  }

  public delete<T>(url: string, params?: any, headers?): Promise<T> {
    const options = { headers, params }

    return this.http.delete<T>(url, options).toPromise()
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
