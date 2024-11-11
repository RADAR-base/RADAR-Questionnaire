import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import {
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
    keyConverter: KeyConverterService
  ) {
    super(logger, http, token, keyConverter)
  }

  init() { }

  processData(data) {
    return { name: 'healthkit', time: getSeconds({milliseconds: Date.now()}), data: { key: data.key, value: data.value } }
  }

  processSingleDatatype(key, data, timeReceived): any[] {
    const type = this.getDataTypeFromKey(key)
    const results = data.map(d =>
      Object.assign(
        {},
        {
          time: getSeconds({ milliseconds: new Date(d.startDate).getTime() }),
          endTime: getSeconds({ milliseconds: new Date(d.endDate).getTime() }),
          timeReceived: timeReceived,
          sourceId: d.sourceBundleId,
          sourceName: d.device.manufacturer + ' ' + d.device.model + ' ' + d.device.hardwareVersion,
          unit: d.unitName,
          key,
          intValue: null,
          floatValue: null,
          doubleValue: null,
          stringValue: null
        } as HealthkitValueExport,
        { [type]: d.value }
      )
    )
    return results
  }

  convertToHealthkitRecord(kafkaValue, valueSchemaMetadata) {
    const data = kafkaValue.data
    const name = data.key
    const startTime = data.value.startTime
    const endTime = data.value.endTime
    return Promise.all([
      this.getLastPollTimes(),
      this.healthkit.query(startTime, endTime, name)
    ]).then(([dic, res]) => {
      if (res.length) {
        const sample = res[res.length - 1]
        const lastDataDate = new Date(sample['endDate'])
        dic[name] = lastDataDate
        this.setLastPollTimes(dic)
        const processedData = this.processSingleDatatype(
          name,
          res,
          Date.now()
        )
        const avroData = this.batchConvertToAvro(
          processedData,
          '',
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
    if (this.schemas[this.HEALTHKIT_TOPIC]) return this.schemas[this.HEALTHKIT_TOPIC]
    else {
      const versionStr = this.URI_version + 'latest'
      const uri =
        this.BASE_URI + this.URI_schema + this.HEALTHKIT_TOPIC + '-value' + versionStr
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
        this.keyConverter.convertToRecord(kafkaKey, this.HEALTHKIT_TOPIC, ''),
        this.convertToHealthkitRecord(kafkaObject, schema)
      ]).then(([key, records]) =>
      ({
        topic: this.getKafkaTopic(kafkaObject.data.key),
        cacheKey: cacheKey,
        record: {
          key_schema_id: key.schema,
          value_schema_id: schema.id,
          records: records ? records.map(r => ({
            key: key.value,
            value: r
          })) : []
        }
      })
      )
    })
  }
}
