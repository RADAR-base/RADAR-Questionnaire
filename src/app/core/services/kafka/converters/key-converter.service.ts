import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AnswerValueExport } from 'src/app/shared/models/answer'
import { KeyExport } from 'src/app/shared/models/kafka'
import { QuestionType } from 'src/app/shared/models/question'
import { getSeconds } from 'src/app/shared/utilities/time'

import { LogService } from '../../misc/log.service'
import { TokenService } from '../../token/token.service'
import { ConverterService } from './converter.service'

@Injectable()
export class KeyConverterService extends ConverterService {
  constructor(logger: LogService, http: HttpClient, token: TokenService) {
    super(logger, http, token)
  }

  init() {}

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
          value: this.convertToAvro(key, kafkaKey),
          topic
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
}
