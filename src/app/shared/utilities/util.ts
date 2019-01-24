import 'rxjs/add/operator/map'
import 'rxjs/add/operator/catch'

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Device } from '@ionic-native/device'
import { throwError as observableThrowError } from 'rxjs'

import { DefaultEndPoint } from '../../../assets/data/defaultConfig'
import { StorageService } from '../../core/services/storage/storage.service'
import { StorageKeys } from '../enums/storage'
import { ObservationKey, SchemaMetadata } from '../models/kafka'

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

  getObservationKey(): Promise<ObservationKey> {
    return Promise.all([
      this.storage.get(StorageKeys.SOURCEID),
      this.storage.get(StorageKeys.PROJECTNAME),
      this.storage.get(StorageKeys.PARTICIPANTLOGIN)
    ]).then(([sourceId, projectName, participantName]) => ({
      sourceId,
      userId: participantName.toString(),
      projectId: projectName
    }))
  }

  getLatestKafkaSchemaVersions(
    specs
  ): Promise<[SchemaMetadata, SchemaMetadata]> {
    const topic = specs.avsc + '_' + specs.name

    return this.storage.get(StorageKeys.OAUTH_TOKENS).then(tokens => {
      return Promise.all([
        this.getLatestKafkaSchemaVersion(
          tokens.access_token,
          topic + '-key',
          'latest'
        ),
        this.getLatestKafkaSchemaVersion(
          tokens.access_token,
          topic + '-value',
          'latest'
        )
      ])
    })
  }

  getLatestKafkaSchemaVersion(
    accessToken,
    questionName,
    version
  ): Promise<SchemaMetadata> {
    const versionStr = this.URI_version + version
    return this.storage
      .get(StorageKeys.BASE_URI)
      .then(baseuri => {
        const endPoint = baseuri ? baseuri : DefaultEndPoint
        const uri = endPoint + this.URI_schema + questionName + versionStr
        console.log(uri)
        return this.http.get(uri).toPromise()
      })
      .then(obj => obj as SchemaMetadata)
  }

  /**
   * Partition the given array into two parts.
   * @param array
   * @param partitionBy partitioning function, if it returns false it goes to partition negative,
   * otherwise a value goes into partition positive
   */
  partition<T>(
    array: T[],
    partitionBy: (T) => boolean
  ): { negative: T[]; positive: T[] } {
    return array.reduce(
      (part, value) => {
        if (partitionBy(value)) {
          part.positive.push(value)
        } else {
          part.negative.push(value)
        }
        return part
      },
      { negative: [], positive: [] }
    )
  }
}
