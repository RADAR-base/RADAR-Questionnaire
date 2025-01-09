import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as AvroSchema from 'avro-js'
import { SchemaAndValue, SchemaMetadata } from 'src/app/shared/models/kafka'
import {
  DefaultSchemaSpecEndpoint
} from 'src/assets/data/defaultConfig'
import * as YAML from 'yaml'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { KeyConverterService } from './key-converter.service'
import { ConfigKeys } from 'src/app/shared/enums/config'
import { RemoteConfigService } from '../../config/remote-config.service'

@Injectable()
export abstract class ConverterService {
  schemas = {}
  specifications
  URI_schema: string = '/schema/subjects/'
  URI_version: string = '/versions/'
  BASE_URI: string

  constructor(
    public logger: LogService,
    private http: HttpClient,
    public token: TokenService,
    public keyConverter: KeyConverterService,
    private remoteConfig: RemoteConfigService
  ) {
    this.updateURI()
    this.getRadarSpecifications()
  }

  init() { }

  abstract getKafkaTopic(payload, topics?)

  processData(data) { }

  getSchemas(topic) {
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

  convertToAvro(kafkaValue, valueSchemaMetadata) {
    const schema = JSON.parse(valueSchemaMetadata.schema)
    return AvroSchema.parse(schema).clone(kafkaValue, { wrapUnions: true })
  }

  batchConvertToAvro(kafkaValues, valueSchemaMetadata) {
    const schema = JSON.parse(valueSchemaMetadata.schema)
    const parsedSchema = AvroSchema.parse(schema)
    return kafkaValues.map(v => parsedSchema.clone(v, { wrapUnions: true }))
  }

  getKafkaPayload(
    type,
    kafkaKey,
    kafkaObject: any,
    cacheKey: any,
    topics
  ): Promise<any[]> {
    return this.getKafkaTopic(kafkaObject, topics).then(topic =>
      this.getSchemas(topic).then(schema => {
        return Promise.all([
          this.keyConverter
            .convertToRecord(kafkaKey, topic, ''),
          this.convertToAvro(kafkaObject, schema)
        ]).then(([key, record]) => ({
          topic,
          cacheKey: cacheKey,
          record: {
            key_schema_id: key.schema,
            value_schema_id: schema.id,
            records: [{ key: key.value, value: record }]
          }
        }))
      })
    )
  }

  getUniqueTimeNow() {
    return new Date().getTime() + Math.random()
  }

  getLatestKafkaSchemaVersion(uri): Promise<SchemaMetadata> {
    return this.http
      .get<SchemaMetadata>(uri)
      .toPromise()
      .catch(e => {
        throw this.logger.error('Failed to get latest Kafka schema versions', e)
      })
  }

  getRadarSpecifications(): Promise<any[] | null> {
    return this.remoteConfig
      .read()
      .then(config =>
        config.getOrDefault(
          ConfigKeys.KAFKA_SPECIFICATION_URL,
          DefaultSchemaSpecEndpoint
        )
      )
      .then(url => this.http.get(url).toPromise())
      .then(res => YAML.parse(atob(res['content'])).data)
      .then(specs => (this.specifications = specs))
      .catch(e => {
        this.logger.error('Failed to get valid RADAR Schema specifications', e)
        return null
      })
  }

  getKafkaTopicFromSpecifications(name): Promise<any> {
    const type = name.toLowerCase()
    if (this.specifications) {
      const spec = this.specifications.find(t => t.type.toLowerCase() == type)
      if (spec && spec.topic) {
        return Promise.resolve(spec.topic)
      }
    }
    return Promise.resolve('questionnaire_response')
  }

  updateURI() {
    return this.token.getURI().then(uri => (this.BASE_URI = uri))
  }

  topicExists(topic: string, topics: string[] | null) {
    if (!topics || topics.includes(topic)) {
      return true
    } else {
      this.logger.error(
        `Cannot send data to specification topic ${topic} because target server does not have it`,
        null
      )
      return false
    }
  }

  reset() {
    this.BASE_URI = null
    this.specifications = null
    this.schemas = {}
  }
}
