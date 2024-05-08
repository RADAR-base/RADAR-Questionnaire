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

  processData(payload) {
    const answers = payload.data.answers
    this.logger.log('Answers to process', answers)
    const values = Object.entries(answers).map(([key, value]) => ({
      questionId: key.toString(),
      value: { startTime: value['startTime'], endTime: value['endTime'] }
    }))
    return { name: 'healthkit', time: Date.now(), data: values }
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
          sourceName: d.source,
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
    const data = kafkaValue.data.filter(q =>
      this.isValidDataType(q.questionId)
    )
    const sampleNames = data.map(d => d.questionId)
    const name = sampleNames[0]
    const startTime = new Date(data[0].value.startTime)
    const endTime = new Date(data[0].value.endTime)
    return Promise.all([
      this.getLastPollTimes(),
      this.healthkit.query(startTime, endTime, name)
    ]).then(([dic, res]) => {
      if (res.length) {
        const resultLength = res.length
        const sample = res[resultLength - 1]
        const lastDataDate = new Date(sample.endDate)
        dic[name] = lastDataDate
        this.setLastPollTimes(dic)
        const processedData = this.processSingleDatatype(
          name,
          res,
          Date.now()
        )
        const value = JSON.parse(valueSchemaMetadata.schema)
        const avroData = this.batchConvertToAvro(
          value,
          processedData,
          valueSchemaMetadata.id
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

  getSchemas(topic) {
    topic = this.HEALTHKIT_TOPIC
    if (this.schemas[topic]) return this.schemas[topic]
    else {
      const versionStr = this.URI_version + 'latest'
      const uri =
        this.BASE_URI + this.URI_schema + topic + '-value' + versionStr
      const schema = this.getLatestKafkaSchemaVersion(uri)
      this.schemas[topic] = schema
      return schema
    }
  }

  isValidDataType(key: HealthkitDataType) {
    return HealthkitStringDataTypes.has(key) || HealthkitFloatDataTypes.has(key)
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
    return this.getSchemas('').then(schema => {
      return Promise.all([
        this.keyConverter.convertToRecord(kafkaKey, this.HEALTHKIT_TOPIC, ''),
        this.convertToHealthkitRecord(kafkaObject['kafkaObject'].value, schema)
      ]).then(([key, records]) =>
      ({
        topic: this.getKafkaTopic(records[0]['value']['key']),
        cacheKey: cacheKey,
        record: {
          key_schema_id: key.schema,
          value_schema_id: records[0]['schema'],
          records: records.map(r => ({
            key: key['value'],
            value: r['value']
          }))
        }
      })
      )
    })
  }

  getProgress() {
    return this.healthkit.getQueryProgress()
  }
}
