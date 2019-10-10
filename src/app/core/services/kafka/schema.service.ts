import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import * as AvroSchema from 'avsc'
import * as YAML from 'yaml'

import { DefaultSchemaSpecEndpoint } from '../../../../assets/data/defaultConfig'
import { ConfigKeys } from '../../../shared/enums/config'
import { AnswerValueExport } from '../../../shared/models/answer'
import { QuestionnaireMetadata } from '../../../shared/models/assessment'
import { CompletionLogValueExport } from '../../../shared/models/completion-log'
import { EventValueExport } from '../../../shared/models/event'
import {
  KeyExport,
  SchemaMetadata,
  SchemaType
} from '../../../shared/models/kafka'
import { Task } from '../../../shared/models/task'
import { ApplicationTimeZoneValueExport } from '../../../shared/models/timezone'
import { getTaskType } from '../../../shared/utilities/task-type'
import { getSeconds } from '../../../shared/utilities/time'
import { QuestionnaireService } from '../config/questionnaire.service'
import { RemoteConfigService } from '../config/remote-config.service'
import { SubjectConfigService } from '../config/subject-config.service'
import { LogService } from '../misc/log.service'

@Injectable()
export class SchemaService {
  URI_schema: string = '/schema/subjects/'
  URI_version: string = '/versions/'
  private schemas: {
    [key: string]: [Promise<SchemaMetadata>, Promise<SchemaMetadata>]
  } = {}

  constructor(
    public questionnaire: QuestionnaireService,
    private config: SubjectConfigService,
    private http: HttpClient,
    private logger: LogService,
    private remoteConfig: RemoteConfigService
  ) {}

  getMetaData(type, task?: Task): Promise<QuestionnaireMetadata> {
    switch (type) {
      case SchemaType.ASSESSMENT:
        return this.questionnaire
          .getAssessment(getTaskType(task), task)
          .then(assessment => assessment.questionnaire)
      default:
        return Promise.resolve({ name: type, avsc: 'questionnaire' })
    }
  }

  getKafkaObjectKey() {
    return Promise.all([
      this.config.getSourceID(),
      this.config.getProjectName(),
      this.config.getParticipantLogin()
    ])
      .then(([sourceId, projectName, participantName]) => ({
        sourceId,
        userId: participantName.toString(),
        projectId: projectName
      }))
      .then(observationKey => observationKey as KeyExport)
  }

  getKafkaObjectValue(type, payload) {
    switch (type) {
      case SchemaType.ASSESSMENT:
        const Answer: AnswerValueExport = {
          name: payload.task.name,
          version: payload.data.scheduleVersion,
          answers: payload.data.answers,
          time: payload.data.time,
          timeCompleted: payload.data.timeCompleted,
          timeNotification: getSeconds({ milliseconds: payload.task.timestamp })
        }
        return Answer
      case SchemaType.COMPLETION_LOG:
        const CompletionLog: CompletionLogValueExport = {
          name: payload.name,
          time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
          timeNotification: getSeconds({
            milliseconds: payload.timeNotification
          }),
          completionPercentage: { double: payload.percentage }
        }
        return CompletionLog
      case SchemaType.TIMEZONE:
        const ApplicationTimeZone: ApplicationTimeZoneValueExport = {
          time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
          offset: getSeconds({ minutes: new Date().getTimezoneOffset() })
        }
        return ApplicationTimeZone
      case SchemaType.APP_EVENT:
        const Event: EventValueExport = {
          time: getSeconds({ milliseconds: this.getUniqueTimeNow() }),
          eventType: payload.eventType.toUpperCase(),
          questionnaireName: payload.questionnaireName
        }
        return Event
    }
  }

  convertToAvro(schema, value): any {
    const options = { wrapUnions: true }
    return AvroSchema.parse(schema, options).clone(value, options)
  }

  getKafkaPayload(kafkaObject, topic, baseURI): Promise<any> {
    if (!this.schemas[topic]) {
      this.schemas[topic] = [
        this.getLatestKafkaSchemaVersion(topic + '-key', 'latest', baseURI),
        this.getLatestKafkaSchemaVersion(topic + '-value', 'latest', baseURI)
      ]
    }
    return Promise.all(this.schemas[topic])
      .then(([keySchemaMetadata, valueSchemaMetadata]) => {
        const key = JSON.parse(keySchemaMetadata.schema)
        const value = JSON.parse(valueSchemaMetadata.schema)
        const payload = {
          key: this.convertToAvro(key, kafkaObject.key),
          value: this.convertToAvro(value, kafkaObject.value)
        }
        return {
          key_schema_id: keySchemaMetadata.id,
          value_schema_id: valueSchemaMetadata.id,
          records: [payload]
        }
      })
      .catch(e => {
        this.schemas[topic] = null
        throw e
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
      .catch(e => {
        this.logger.error('Failed to get valid RADAR Schema specifications', e)
        return null
      })
  }

  getKafkaTopic(specifications: any[] | null, name, avsc): string {
    const type = name.toLowerCase()
    const defaultTopic = `${avsc}_${name}`
    if (specifications) {
      const spec = specifications.find(t => t.type.toLowerCase() == type)
      return spec && spec.topic ? spec.topic : defaultTopic
    }
    return defaultTopic
  }

  getLatestKafkaSchemaVersion(
    questionName,
    version,
    endPoint
  ): Promise<SchemaMetadata> {
    const versionStr = this.URI_version + version
    const uri = endPoint + this.URI_schema + questionName + versionStr

    return this.http
      .get(uri)
      .toPromise()
      .catch(e => {
        throw this.logger.error('Failed to get latest Kafka schema versions', e)
      })
      .then(obj => obj as SchemaMetadata)
  }

  getUniqueTimeNow() {
    return new Date().getTime() + Math.random()
  }
}
