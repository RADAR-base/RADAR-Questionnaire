import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import {
  HealthKitDataKey,
  HealthKitDataTypeKey,
  HealthkitDataType,
  HealthkitFloatDataTypes,
  HealthkitStringDataTypes,
  HealthkitTopic,
  HealthkitValueExport
} from 'src/app/shared/models/health'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'
import { StorageService } from '../../storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import { KeyConverterService } from './key-converter.service'
import { Utility } from 'src/app/shared/utilities/util'
import { RemoteConfigService } from '../../config/remote-config.service'
import { HealthkitService } from 'src/app/pages/tasks/healthkit/services/healthkit.service'

@Injectable()
export class HealthkitConverterService extends ConverterService {
  GENERAL_TOPIC: string = 'questionnaire_response'
  HEALTHKIT_TOPIC = 'active_apple_healthkit_steps'

  constructor(
    private healthkit: HealthkitService,
    private storage: StorageService,
    private util: Utility,
    logger: LogService,
    http: HttpClient,
    token: TokenService,
    keyConverter: KeyConverterService,
    remoteConfig: RemoteConfigService
  ) {
    super(logger, http, token, keyConverter, remoteConfig)
  }

  processData(data) {
    return {
      name: 'healthkit',
      time: getSeconds({ milliseconds: Date.now() }),
      data: { key: data.key, value: data.value }
    }
  }

  async processSingleDatatype(
    key: string,
    data: any[],
    timeReceived: number
  ): Promise<any[]> {
    const type = this.getDataTypeFromKey(key)
    const valueKey = this.getValueKey(key)

    if (typeof Worker !== 'undefined') {
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          'assets/workers/healthkit-converter.worker.js'
        )

        worker.onmessage = ({ data }) => {
          resolve(data)
          worker.terminate()
        }

        worker.onerror = error => {
          reject(error)
          worker.terminate()
        }
        worker.postMessage({
          key,
          inputData: data,
          timeReceived,
          type,
          valueKey
        })
      })
    } else {
      return data.map(d =>
        Object.assign(
          {},
          {
            time: Math.floor(new Date(d.startDate).getTime() / 1000),
            endTime: Math.floor(new Date(d.endDate).getTime() / 1000),
            timeReceived: timeReceived,
            sourceId: d.sourceBundleId,
            sourceName: d.device
              ? `${d.device.manufacturer}_${d.device.model}_${d.device.hardwareVersion}`
              : d.source,
            unit: d.unitName ?? '',
            key,
            intValue: null,
            floatValue: null,
            doubleValue: null,
            stringValue: null
          },
          { [type]: d[valueKey] }
        )
      )
    }
  }

  convertToHealthkitRecord(kafkaValue, valueSchemaMetadata) {
    const data = kafkaValue.data
    const name = data.key
    const startTime = data.value.startTime
    const endTime = data.value.endTime
    return this.healthkit.query(startTime, endTime, name).then(async res => {
      if (res.length) {
        const sample = res[res.length - 1]
        const lastDataDate = new Date(sample['endDate'])
        const processedData = await this.processSingleDatatype(
          name,
          res,
          Date.now()
        )
        const avroData = this.batchConvertToAvro(
          processedData,
          valueSchemaMetadata
        )
        return avroData
      }
      return null
    })
  }

  getSchemas() {
    if (!this.BASE_URI) {
      return this.updateURI().then(() => this.getSchemas())
    }
    if (this.schemas[this.HEALTHKIT_TOPIC])
      return Promise.resolve(this.schemas[this.HEALTHKIT_TOPIC])
    else {
      const versionStr = this.URI_version + 'latest'
      const uri =
        this.BASE_URI +
        this.URI_schema +
        this.HEALTHKIT_TOPIC +
        '-value' +
        versionStr
      return this.getLatestKafkaSchemaVersion(uri).then(
        schema => {
          this.schemas[this.HEALTHKIT_TOPIC] = schema
          return schema
        }
      ).catch(error => {
        throw error
      })
    }
  }

  getDataTypeFromKey(key) {
    if (HealthkitStringDataTypes.has(key as HealthkitDataType)) {
      return HealthKitDataTypeKey.STRING
    } else return HealthKitDataTypeKey.FLOAT
  }

  getValueKey(type) {
    if (type == HealthkitDataType.SLEEP_ANALYSIS)
      return HealthKitDataKey.SLEEP_STATE
    if (type == HealthkitDataType.WORKOUT_TYPE)
      return HealthKitDataKey.ACTIVITY_TYPE
    return HealthKitDataKey.DEFAULT
  }

  getKafkaTopic(key): String {
    for (const k in HealthkitDataType) {
      if (HealthkitDataType[k] == key) return HealthkitTopic[k]
    }
    return this.HEALTHKIT_TOPIC
  }

  getKafkaPayload(
    type,
    kafkaKey,
    kafkaObject: any,
    cacheKey: any,
    topics
  ): Promise<any[]> {
    return this.getSchemas().then(schema => {
      return Promise.all([
        this.keyConverter.convertToRecord(kafkaKey, this.HEALTHKIT_TOPIC),
        this.convertToHealthkitRecord(kafkaObject, schema)
      ]).then(([key, records]) => ({
        topic: this.getKafkaTopic(kafkaObject.data.key),
        cacheKey: cacheKey,
        record: {
          key_schema_id: key.schema,
          value_schema_id: schema.id,
          records: records
            ? records.map(r => ({
              key: key.value,
              value: r
            }))
            : []
        }
      }))
    })
  }

  reset() {
    super.reset()
    this.healthkit.setUploadReadyFlag(false)
  }
}
