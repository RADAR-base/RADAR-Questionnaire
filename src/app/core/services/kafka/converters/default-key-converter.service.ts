import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { KeyExport, SchemaMetadata } from 'src/app/shared/models/kafka'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { KeyConverterService } from './key-converter.service'

@Injectable()
export class DefaultKeyConverterService extends KeyConverterService {
  schemas = {}
  specifications
  URI_schema: string = '/schema/subjects/'
  URI_version: string = '/versions/'
  BASE_URI: string

  constructor(private logger: LogService, private http: HttpClient, public token: TokenService,
  ) {
    super()
    this.updateURI()
  }

  updateURI() {
    return this.token.getURI().then(uri => (this.BASE_URI = uri))
  }

  async getSchema(topic) {
    if (this.schemas[topic]) return Promise.resolve(this.schemas[topic])
    else {
      const versionStr = this.URI_version + 'latest'
      const uri =
        this.BASE_URI +
        this.URI_schema +
        topic +
        '-key' +
        versionStr
      const schema = await this.getLatestKafkaSchemaVersion(uri)
      this.schemas[topic] = schema
      return schema
    }
  }

  convertToRecord(kafkaKey, topic): any {
    return this.getSchema(topic).then(keySchemaMetadata => {
      const key = JSON.parse(keySchemaMetadata.schema)
      const record = {
        schema: keySchemaMetadata.id,
        value: this.convertToAvro(key, kafkaKey)
      }
      return record
    })
  }

  processData(payload) {
    const key: KeyExport = {
      sourceId: payload.sourceId,
      userId: payload.userId,
      projectId: payload.projectId
    }

    return key
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
