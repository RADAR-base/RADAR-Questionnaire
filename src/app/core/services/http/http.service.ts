import { Injectable } from '@angular/core'
import { Platform } from 'ionic-angular'

import { HttpAngularService } from './http-angular.service'
import { HttpNativeService } from './http-native.service'

@Injectable()
export class HttpService {
  public http: HttpNativeService | HttpAngularService

  constructor(
    private platform: Platform,
    private angularHttp: HttpAngularService,
    private nativeHttp: HttpNativeService
  ) {
    this.http =
      this.platform.is('ios') || this.platform.is('android')
        ? this.nativeHttp
        : this.angularHttp
  }

  public get<T>(url: string, params?: any, options?: any): Promise<T> {
    return this.http.get<T>(url, params, options)
  }

  public post<T>(url: string, params?: any, options?: any): Promise<T> {
    return this.http.post<T>(url, params, options)
  }

  public delete<T>(url: string, params?: any, options?: any): Promise<T> {
    return this.http.delete<T>(url, params, options)
  }
}
