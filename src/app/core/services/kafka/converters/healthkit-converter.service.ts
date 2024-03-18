import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import {
  HealthKitDataTypeKey,
  HealthkitDataType,
  HealthkitStringDataType
} from 'src/app/shared/models/health'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'
import { HealthkitService } from 'src/app/pages/questions/services/healthkit.service'
import { StorageService } from '../../storage/storage.service'
import { StorageKeys } from 'src/app/shared/enums/storage'
import { KeyConverterService } from './key-converter.service'

@Injectable()
export class HealthkitConverterService extends ConverterService {
  GENERAL_TOPIC: string = 'questionnaire_response'
  HEALTHKIT_TOPIC = 'active_apple_healthkit_steps'

  HEALTHKIT_KEYS: Set<HealthkitDataType> = new Set([
    HealthkitDataType.ACTIVITY,
    HealthkitDataType.APPLE_EXERCISE_TIME,
    HealthkitDataType.CALORIES,
    HealthkitDataType.DISTANCE,
    HealthkitDataType.STAIRS,
    HealthkitDataType.VO2MAX
  ])

  constructor(
    private healthkit: HealthkitService,
    private storage: StorageService,
    logger: LogService,
    http: HttpClient,
    token: TokenService,
    keyConverter: KeyConverterService
  ) {
    super(logger, http, token, keyConverter)
  }

  init() {}

  processData(payload) {
    return this.processCacheData(payload.data.answers)
  }

  processCacheData(answers) {
    this.logger.log('Answers to process', answers)
    const values = Object.entries(answers).map(([key, value]) => ({
      questionId: key.toString(),
      value: { startTime: value['startTime'], endTime: value['endTime'] }
    }))
    return { name: 'healthkit', time: Date.now(), data: values }
  }

  processSingleDatatype(key, data, timeReceived) {
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
        },
        { [type]: d.value }
      )
    )
    return results
  }

  batchConvertToRecord(kafkaValues, topic, valueSchemaMetadata) {
    return Promise.all(
      kafkaValues.map(questionnaire =>
        Promise.all(
          questionnaire.data.map(q => {
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
              .then(res => {
                const value = JSON.parse(valueSchemaMetadata.schema)
                const result = this.batchConvertToAvro(value, res).map(v => ({
                  value: v,
                  schema: valueSchemaMetadata.id,
                  type: dataType
                }))
                return result
              })
          })
        )
      )
    ).then(res => res.flat().filter(r => r.length))
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

  getDataTypeFromKey(key) {
    if (
      Object.values(HealthkitStringDataType).includes(
        key as HealthkitStringDataType
      )
    ) {
      return HealthKitDataTypeKey.STRING
    } else return HealthKitDataTypeKey.FLOAT
  }

  getKafkaTopic(payload, topics): Promise<any> {
    const key = payload.key
    return Promise.resolve('active_apple_healthkit_' + key)
  }

  getKafkaPayload(
    type,
    kafkaKey,
    kafkaObjects: any[],
    cacheKeys: any[],
    topics
  ): Promise<any[]> {
    return this.getKafkaTopic(kafkaObjects[0], topics).then(topic =>
      this.getSchemas(topic).then(schema => {
        return Promise.all([
          this.keyConverter.convertToRecord(kafkaKey, this.HEALTHKIT_TOPIC, ''),
          this.batchConvertToRecord(kafkaObjects, topic, schema)
        ]).then(([key, records]) => {
          return records.map(v => ({
            topic: this.HEALTHKIT_TOPIC,
            cacheKey: cacheKeys,
            record: {
              key_schema_id: key.schema,
              value_schema_id: v[0]['schema'],
              records: v.map(r => ({ key: key['value'], value: r['value'] }))
            }
          }))
        })
      })
    )
  }
}
