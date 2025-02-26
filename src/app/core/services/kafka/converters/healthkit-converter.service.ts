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
import { HealthkitService } from 'src/app/pages/questions/services/healthkit.service'
import { StorageService } from '../../storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import { KeyConverterService } from './key-converter.service'
import { Utility } from 'src/app/shared/utilities/util'
import { RemoteConfigService } from '../../config/remote-config.service'

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

  init() { }

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
    return Promise.all([
      this.getLastPollTimes(),
      this.healthkit.query(startTime, endTime, name)
    ]).then(async ([dic, res]) => {
      if (res.length) {
        const sample = res[res.length - 1]
        const lastDataDate = new Date(sample['endDate'])
        dic[name] = lastDataDate
        this.setLastPollTimes(dic)
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

  setLastPollTimes(dic: any) {
    return this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, dic)
  }

  getLastPollTimes() {
    return this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
  }

  getSchemas() {
    if (this.schemas[this.HEALTHKIT_TOPIC])
      return this.schemas[this.HEALTHKIT_TOPIC]
    else {
      const versionStr = this.URI_version + 'latest'
      const uri =
        this.BASE_URI +
        this.URI_schema +
        this.HEALTHKIT_TOPIC +
        '-value' +
        versionStr
      const schema = this.getLatestKafkaSchemaVersion(uri)
      this.schemas[this.HEALTHKIT_TOPIC] = schema
      return schema
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
}
