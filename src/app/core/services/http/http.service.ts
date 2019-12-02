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

  public get(url: string, params?: any, options?: any): Promise<Object> {
    return this.http.get(url, params, options)
  }

  public post(url: string, params?: any, options?: any): Promise<Object> {
    return this.http.post(url, params, options)
  }
}
