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
  MAX_RECORD_SIZE = 5_000

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

  processSingleDatatype(key, data, timeReceived): any[][] {
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
    return this.util.chunk(results, this.MAX_RECORD_SIZE)
  }

  batchConvertToRecord(kafkaValues, topic, valueSchemaMetadata) {
    return Promise.all(
      kafkaValues.map(questionnaire =>
        Promise.all(
          questionnaire.data
            .filter(q => this.isValidDataType(q.questionId))
            .map(q => {
              let dataType = q.questionId
              const startTime = new Date(q.value.startTime)
              const endTime = new Date(q.value.endTime)
              return Promise.all([
                this.getLastPollTimes(),
                this.healthkit.query(startTime, endTime, dataType)
              ])
                .then(([dic, res]) => {
                  if (res.length) {
                    const lastDataDate = new Date(res[res.length - 1].endDate)
                    dic[dataType] = lastDataDate
                    this.setLastPollTimes(dic)
                  }
                  return this.processSingleDatatype(dataType, res, Date.now())
                })
                .then((res: any[][]) => {
                  let result = []
                  const value = JSON.parse(valueSchemaMetadata.schema)
                  res.map(r =>
                    result.push(
                      this.batchConvertToAvro(value, r).map(v => ({
                        value: v,
                        schema: valueSchemaMetadata.id,
                        type: dataType
                      }))
                    ))
                  return result
                })
            })
        )
      )
    ).then(res => res.flat(2).filter(r => r.length))
  }
  setLastPollTimes(dic: any) {
    return this.storage.set(StorageKeys.HEALTH_LAST_POLL_TIMES, dic)
  }

  getLastPollTimes() {
    return this.storage.get(StorageKeys.HEALTH_LAST_POLL_TIMES)
  }

  getSchemas(topic) {
    console.log(`Geting schema for ${topic}`)
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
    kafkaObjects: any[],
    cacheKeys: any[],
    topics
  ): Promise<any[]> {
    return this.getSchemas('').then(schema => {
      return Promise.all([
        this.keyConverter.convertToRecord(kafkaKey, this.HEALTHKIT_TOPIC, ''),
        this.batchConvertToRecord(kafkaObjects, '', schema)
      ]).then(([key, records]) => {
        return records.map(v => {
          const sample = v[0]
          return {
            topic: this.getKafkaTopic(sample.type),
            cacheKey: cacheKeys,
            record: {
              key_schema_id: key.schema,
              value_schema_id: sample.schema,
              records: v.map(r => ({ key: key['value'], value: r['value'] }))
            }
          }
        })
      })
    })
  }
}
