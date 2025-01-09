import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { KeyExport, SchemaMetadata } from 'src/app/shared/models/kafka'
import * as AvroSchema from 'avro-js'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'

@Injectable()
export class KeyConverterService {
  schemas = {}
  specifications
  URI_schema: string = '/schema/subjects/'
  URI_version: string = '/versions/'
  BASE_URI: string

  constructor(private logger: LogService, private http: HttpClient, public token: TokenService,
  ) {
    this.updateURI()
  }

  updateURI() {
    return this.token.getURI().then(uri => (this.BASE_URI = uri))
  }

  getKafkaTopic(payload): Promise<any> {
    return Promise.resolve()
  }

  getSchemas(topic) {
    if (this.schemas[topic]) return this.schemas[topic]
    else {
      const versionStr = this.URI_version + 'latest'
      const uri =
        this.BASE_URI +
        this.URI_schema +
        'questionnaire_response' +
        '-key' +
        versionStr
      const schema = this.getLatestKafkaSchemaVersion(uri)
      this.schemas[topic] = schema
      return schema
    }
  }

  convertToRecord(kafkaKey, topics, schema): any {
    return this.getKafkaTopic(kafkaKey).then(topic =>
      this.getSchemas(topic).then(keySchemaMetadata => {
        const key = JSON.parse(keySchemaMetadata.schema)
        const record = {
          schema: keySchemaMetadata.id,
          value: this.convertToAvro(key, kafkaKey)
        }
        return record
      })
    )
  }

  processData(payload) {
    const key: KeyExport = {
      sourceId: payload.sourceId,
      userId: payload.userId,
      projectId: payload.projectId
    }

    return key
  }

  convertToAvro(schema, value): any {
    return AvroSchema.parse(schema).clone(value, { wrapUnions: true })
  }

  getLatestKafkaSchemaVersion(uri): Promise<SchemaMetadata> {
    return this.http
      .get<SchemaMetadata>(uri)
      .toPromise()
      .catch(e => {
        throw this.logger.error('Failed to get latest Kafka schema versions', e)
      })
  }
}
