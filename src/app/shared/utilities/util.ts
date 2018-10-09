import 'rxjs/add/operator/map'

import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device'
import { Observable, throwError as observableThrowError } from 'rxjs'

import { DefaultEndPoint } from '../../../assets/data/defaultConfig'
import { StorageService } from '../../providers/storage-service'
import { StorageKeys } from '../enums/storage'

@Injectable()
export class Utility {
  URI_schema: string = '/schema/subjects/'
  URI_version: string = '/versions/'

  constructor(
    private http: HttpClient,
    private device: Device,
    private storage: StorageService
  ) {}

  getSchema(schemaUrl) {
    return this.http
      .get(schemaUrl)
      .map(this.extractData)
      .catch(this.handleError)
  }

  getDevice() {
    if (this.device.platform === undefined || null) {
      return {
        isDeviceReady: false,
        device: this.device
      }
    } else {
      return {
        isDeviceReady: true,
        device: this.device
      }
    }
  }

  private extractData(res: any) {
    const body = res.json()
    return body || []
  }

  private handleError(error: any) {
    let errMsg: string

    // TODO: Fix types
    // if (error instanceof any) {
    //   const body = error.json() || ''
    //   const err = body.error || JSON.stringify(body)
    //   errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    // } else {
    //   errMsg = error.message ? error.message : error.toString()
    // }
    errMsg = error.message ? error.message : error.toString()

    console.error(errMsg)
    return observableThrowError(errMsg)
  }

  getSourceKeyInfo() {
    const sourceId = this.storage.get(StorageKeys.SOURCEID)
    const projectId = this.storage.get(StorageKeys.PROJECTNAME)
    const pariticipantId = this.storage.get(StorageKeys.PARTICIPANTLOGIN)
    return Promise.all([sourceId, projectId, pariticipantId])
  }

  getLatestKafkaSchemaVersions(specs) {
    const qKey = specs.avsc + '_' + specs.name + '-key'
    const qVal = specs.avsc + '_' + specs.name + '-value'
    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      const keys = this.getLatestKafkaSchemaVersion(
        tokens.access_token,
        qKey,
        'latest'
      )
      const vals = this.getLatestKafkaSchemaVersion(
        tokens.access_token,
        qVal,
        'latest'
      )
      return Promise.all([keys, vals])
      /*return Promise.all([keys, vals]).then(versions => {
        var versionReqKey, versionReqValue
        for(let key in versions[0]) {versionReqKey = versions[0][key]}
        for(let key in versions[1]) {versionReqValue = versions[1][key]}
        let key = this.getLatestKafkaSchemaVersion(tokens.access_token, qKey, versionReqKey)
        let val = this.getLatestKafkaSchemaVersion(tokens.access_token, qVal, versionReqValue)
        return Promise.all([key, val, specs])
      })*/
    })
  }

  getLatestKafkaSchemaVersion(accessToken, questionName, version) {
    const versionStr = this.URI_version + version
    return this.storage.get(StorageKeys.BASE_URI).then(baseuri => {
      const endPoint = baseuri ? baseuri : DefaultEndPoint
      const uri = endPoint + this.URI_schema + questionName + versionStr
      console.log(uri)
      return this.http.get(uri).toPromise()
    })
  }
}
