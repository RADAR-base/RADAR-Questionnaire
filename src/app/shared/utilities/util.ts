import 'rxjs/add/operator/map'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device/ngx'
import { throwError as observableThrowError } from 'rxjs'

import {
  DefaultEndPoint,
  DefaultSchemaSpecEndpoint
} from '../../../assets/data/defaultConfig'
import { StorageService } from '../../core/services/storage.service'
import { StorageKeys } from '../enums/storage'
import * as YAML from 'yamljs'

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

  getKafkaTopic(specs) {
    const type = specs.name.toLowerCase()
    const defaultTopic = `${specs.avsc}_${specs.name}`
    return this.http
      .get(DefaultSchemaSpecEndpoint, { responseType: 'text' })
      .toPromise()
      .then(res => {
        const schemaSpecs = YAML.parse(res).data
        const topic = schemaSpecs.find(t => t.type.toLowerCase() == type).topic
        if (topic) return topic
        else Promise.reject()
      })
      .catch(e => defaultTopic)
  }

  getLatestKafkaSchemaVersions(topic) {
    const qKey = topic + '-key'
    const qVal = topic + '-value'
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
