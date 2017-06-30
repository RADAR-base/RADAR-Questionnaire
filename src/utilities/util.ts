

import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import { Http, Response } from '@angular/http'

import { StorageService } from '../providers/storage-service'
import { StorageKeys } from '../enums/storage'

@Injectable()
export class Utility {

  constructor(
    private http: Http,
    private device: Device,
    private storage: StorageService
  ) {
  }
  private schemaUrl = 'assets/data/schema/schemas.json'


  getSchema(schemaUrl) {
    return this.http.get(schemaUrl)
      .map(this.extractData)
      .catch(this.handleError)
  }


  getDevice() {
    if (this.device.platform == undefined || null) {
      return {
        "isDeviceReady": false,
        "device": this.device
      }
    } else {
      return {
        "isDeviceReady": true,
        "device": this.device
      }
    }
  }

  private extractData(res: Response) {
    const body = res.json()
    return body || []

  }

  private handleError(error: Response | any) {
    let errMsg: string

    if (error instanceof Response) {
      const body = error.json() || ''
      const err = body.error || JSON.stringify(body)
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    } else {
      errMsg = error.message
        ? error.message
        : error.toString()
    }

    console.error(errMsg)
    return Observable.throw(errMsg)
  }

}
